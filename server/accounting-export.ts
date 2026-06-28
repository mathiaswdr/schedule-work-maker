import PizZip from "pizzip";
import type { Prisma } from "@prisma/client";

import { generateInvoicePdf, type InvoiceData } from "@/lib/invoice-pdf";
import { prisma } from "@/server/prisma";

type AccountingExportInvoice = Prisma.InvoiceGetPayload<{
  include: {
    client: { select: { name: true } };
    project: { select: { name: true } };
    items: true;
  };
}>;

type AccountingExportExpenseReceipt = Prisma.ExpenseReceiptGetPayload<{
  include: {
    expense: true;
  };
}>;

type AccountingExportPeriod = {
  startDate: Date;
  endDate: Date;
};

type AttachmentFailure = {
  path: string;
  url: string;
  reason: string;
};

const CSV_SEPARATOR = ",";

export function parseAccountingExportPeriod(searchParams: URLSearchParams): AccountingExportPeriod {
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    throw new Error("Missing period");
  }

  const startDate = parseDateOnly(start, false);
  const endDate = parseDateOnly(end, true);

  if (!startDate || !endDate || startDate > endDate) {
    throw new Error("Invalid period");
  }

  return { startDate, endDate };
}

export async function getAccountingExportSummary(
  userId: string,
  period: AccountingExportPeriod
) {
  const [invoices, expenseReceipts] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      select: {
        id: true,
        status: true,
        subtotal: true,
        taxAmount: true,
        total: true,
      },
    }),
    prisma.expenseReceipt.findMany({
      where: {
        billedAt: {
          gte: period.startDate,
          lte: period.endDate,
        },
        expense: { userId },
      },
      select: {
        id: true,
        amount: true,
        expense: { select: { amount: true } },
      },
    }),
  ]);

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalInvoiceTax = invoices.reduce((sum, invoice) => sum + invoice.taxAmount, 0);
  const totalPaid = invoices.reduce(
    (sum, invoice) => sum + (invoice.status === "PAID" ? invoice.total : 0),
    0
  );
  const totalExpenses = expenseReceipts.reduce(
    (sum, receipt) => sum + (receipt.amount ?? receipt.expense.amount),
    0
  );

  return {
    invoiceCount: invoices.length,
    expenseCount: expenseReceipts.length,
    totalInvoiced,
    totalInvoiceTax,
    totalPaid,
    totalExpenses,
  };
}

export async function buildAccountingExportZip({
  userId,
  locale,
  period,
}: {
  userId: string;
  locale?: string | null;
  period: AccountingExportPeriod;
}) {
  const [user, invoices, expenseReceipts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        currency: true,
        businessProfile: {
          select: {
            companyName: true,
            email: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        items: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ issueDate: "asc" }, { number: "asc" }],
    }),
    prisma.expenseReceipt.findMany({
      where: {
        billedAt: {
          gte: period.startDate,
          lte: period.endDate,
        },
        expense: { userId },
      },
      include: {
        expense: true,
      },
      orderBy: [{ billedAt: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const zip = new PizZip();
  const failures: AttachmentFailure[] = [];
  const currency = user?.currency ?? "CHF";
  const companyName = user?.businessProfile?.companyName ?? user?.name ?? user?.email ?? "Kronoma";
  const generatedAt = new Date();

  zip.file("factures.csv", buildInvoicesCsv(invoices, currency));
  zip.file("depenses.csv", buildExpensesCsv(expenseReceipts, currency));

  for (const invoice of invoices) {
    const fileBaseName = sanitizeFileName(invoice.displayNumber || `facture-${invoice.number}`);

    const failureCountBeforeRemoteInvoice = failures.length;
    if (invoice.source === "UPLOADED" && invoice.fileUrl) {
      const addedRemoteFile = await addRemoteFileToZip({
        zip,
        url: invoice.fileUrl,
        pathWithoutExtension: `factures/${fileBaseName}`,
        fallbackExtension: ".pdf",
        failures,
      });

      if (addedRemoteFile) {
        continue;
      }
    }

    try {
      const pdf = await generateInvoicePdf(
        invoiceToPdfData(invoice, currency),
        locale
      );
      zip.file(`factures/${fileBaseName}.pdf`, pdf);
      failures.splice(failureCountBeforeRemoteInvoice);
    } catch (error) {
      failures.push({
        path: `factures/${fileBaseName}.pdf`,
        url: "generated",
        reason: error instanceof Error ? error.message : "PDF generation failed",
      });
    }
  }

  for (const receipt of expenseReceipts) {
    const expenseName = sanitizeFileName(receipt.expense.name);
    const receiptName = sanitizeFileName(
      receipt.invoiceNumber || receipt.fileName || `justificatif-${formatDateForFile(receipt.billedAt)}`
    );

    await addRemoteFileToZip({
      zip,
      url: receipt.fileUrl,
      pathWithoutExtension: `justificatifs/${expenseName}-${formatDateForFile(receipt.billedAt)}-${receipt.id.slice(0, 8)}-${receiptName}`,
      fallbackExtension: ".pdf",
      failures,
    });
  }

  const summary = await getAccountingExportSummary(userId, period);
  zip.file(
    "README.txt",
    buildReadme({
      companyName,
      currency,
      generatedAt,
      period,
      summary,
      failures,
    })
  );

  const buffer = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    buffer,
    filename: buildAccountingExportFilename(period),
  };
}

export function buildAccountingExportFilename(period: AccountingExportPeriod) {
  const start = period.startDate;
  const end = period.endDate;

  if (
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === 0 &&
    start.getUTCDate() === 1 &&
    end.getUTCMonth() === 11 &&
    end.getUTCDate() === 31
  ) {
    return `kronoma-export-comptable-${start.getUTCFullYear()}.zip`;
  }

  const quarter = getQuarterLabel(period);
  if (quarter) {
    return `kronoma-export-comptable-${quarter}.zip`;
  }

  return `kronoma-export-comptable-${formatDateForFile(start)}-${formatDateForFile(end)}.zip`;
}

function buildInvoicesCsv(invoices: AccountingExportInvoice[], currency: string) {
  const rows = invoices.map((invoice) => {
    const fileName =
      invoice.source === "UPLOADED" && invoice.fileUrl
        ? getFileNameFromUrl(invoice.fileUrl, `${invoice.displayNumber}.pdf`)
        : `${sanitizeFileName(invoice.displayNumber)}.pdf`;

    return [
      invoice.displayNumber,
      formatDate(invoice.issueDate),
      invoice.dueDate ? formatDate(invoice.dueDate) : "",
      invoice.clientName || invoice.client?.name || "",
      invoice.status,
      currency,
      formatNumber(invoice.subtotal),
      formatNumber(invoice.taxAmount),
      formatNumber(invoice.total),
      formatNumber(invoice.status === "PAID" ? invoice.total : 0),
      fileName,
    ];
  });

  return toCsv(
    [
      "numero_facture",
      "date_emission",
      "date_echeance",
      "client",
      "statut",
      "devise",
      "sous_total",
      "tva",
      "total",
      "montant_paye",
      "fichier_pdf",
    ],
    rows
  );
}

function buildExpensesCsv(expenseReceipts: AccountingExportExpenseReceipt[], currency: string) {
  const rows = expenseReceipts.map((receipt) => {
    const total = receipt.amount ?? receipt.expense.amount;

    return [
      formatDate(receipt.billedAt),
      receipt.expense.name,
      receipt.expense.category ?? "",
      receipt.notes || receipt.expense.notes || "",
      currency,
      "",
      "",
      formatNumber(total),
      "PAID",
      "",
      receipt.fileName || getFileNameFromUrl(receipt.fileUrl, ""),
    ];
  });

  return toCsv(
    [
      "date",
      "fournisseur",
      "categorie",
      "description",
      "devise",
      "montant_ht",
      "tva",
      "montant_ttc",
      "statut_paiement",
      "projet_ou_client",
      "justificatif",
    ],
    rows
  );
}

function buildReadme({
  companyName,
  currency,
  generatedAt,
  period,
  summary,
  failures,
}: {
  companyName: string;
  currency: string;
  generatedAt: Date;
  period: AccountingExportPeriod;
  summary: Awaited<ReturnType<typeof getAccountingExportSummary>>;
  failures: AttachmentFailure[];
}) {
  const lines = [
    "Export comptable Kronoma",
    "",
    `Entreprise: ${companyName}`,
    `Periode: ${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
    `Genere le: ${generatedAt.toISOString()}`,
    `Devise: ${currency}`,
    "",
    "Totaux",
    `- Factures: ${summary.invoiceCount}`,
    `- Depenses: ${summary.expenseCount}`,
    `- Total facture: ${formatNumber(summary.totalInvoiced)} ${currency}`,
    `- Taxe facturee: ${formatNumber(summary.totalInvoiceTax)} ${currency}`,
    `- Total encaisse: ${formatNumber(summary.totalPaid)} ${currency}`,
    `- Total depenses: ${formatNumber(summary.totalExpenses)} ${currency}`,
    "",
    "Contenu",
    "- factures.csv",
    "- depenses.csv",
    "- factures/: PDFs generes ou fichiers de factures importes",
    "- justificatifs/: fichiers justificatifs lies aux depenses",
  ];

  if (failures.length > 0) {
    lines.push("", "Fichiers non inclus");
    for (const failure of failures) {
      lines.push(`- ${failure.path}: ${failure.reason} (${failure.url})`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function invoiceToPdfData(
  invoice: AccountingExportInvoice,
  currency: string
): InvoiceData {
  return {
    displayNumber: invoice.displayNumber,
    senderName: invoice.senderName,
    senderAddress: invoice.senderAddress,
    senderPostalCode: invoice.senderPostalCode,
    senderCity: invoice.senderCity,
    senderCountry: invoice.senderCountry,
    senderSiret: invoice.senderSiret,
    senderEmail: invoice.senderEmail,
    senderPhone: invoice.senderPhone,
    senderLogoUrl: invoice.senderLogoUrl,
    senderVatMention: invoice.senderVatMention,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    clientAddress: invoice.clientAddress,
    clientPostalCode: invoice.clientPostalCode,
    clientCity: invoice.clientCity,
    clientCountry: invoice.clientCountry,
    location: invoice.location,
    title: invoice.title,
    subject: invoice.subject,
    bankName: invoice.bankName,
    iban: invoice.iban,
    bic: invoice.bic,
    paymentTerms: invoice.paymentTerms,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    subtotal: invoice.subtotal,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    currency,
    templateType: invoice.templateType,
    items: invoice.items.map((item) => ({
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
  };
}

async function addRemoteFileToZip({
  zip,
  url,
  pathWithoutExtension,
  fallbackExtension,
  failures,
}: {
  zip: PizZip;
  url: string;
  pathWithoutExtension: string;
  fallbackExtension: string;
  failures: AttachmentFailure[];
}) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    const extension = getExtensionFromUrl(url) || getExtensionFromContentType(contentType) || fallbackExtension;
    const buffer = Buffer.from(await response.arrayBuffer());

    zip.file(`${pathWithoutExtension}${extension}`, buffer);
    return true;
  } catch (error) {
    failures.push({
      path: `${pathWithoutExtension}${fallbackExtension}`,
      url,
      reason: error instanceof Error ? error.message : "Download failed",
    });
    return false;
  }
}

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [
    headers.join(CSV_SEPARATOR),
    ...rows.map((row) => row.map(escapeCsvValue).join(CSV_SEPARATOR)),
  ].join("\n");
}

function escapeCsvValue(value: string | number) {
  const stringValue = String(value ?? "");
  if (stringValue.includes('"') || stringValue.includes("\n") || stringValue.includes(CSV_SEPARATOR)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function parseDateOnly(value: string, endOfDay: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const date = new Date(`${value}${suffix}`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateForFile(value: Date) {
  return formatDate(value);
}

function formatNumber(value: number) {
  return value.toFixed(2);
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "document";
}

function getFileNameFromUrl(url: string, fallback: string) {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).at(-1);
    return last ? decodeURIComponent(last) : fallback;
  } catch {
    return fallback;
  }
}

function getExtensionFromUrl(url: string) {
  const fileName = getFileNameFromUrl(url, "");
  const match = fileName.match(/\.[a-z0-9]{2,8}$/i);
  return match?.[0] ?? null;
}

function getExtensionFromContentType(contentType: string | null) {
  if (!contentType) return null;
  if (contentType.includes("pdf")) return ".pdf";
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return null;
}

function getQuarterLabel(period: AccountingExportPeriod) {
  const start = period.startDate;
  const end = period.endDate;
  const year = start.getUTCFullYear();

  if (year !== end.getUTCFullYear()) return null;

  const quarterStarts = [
    { month: 0, label: "Q1" },
    { month: 3, label: "Q2" },
    { month: 6, label: "Q3" },
    { month: 9, label: "Q4" },
  ];

  const match = quarterStarts.find(({ month }) => {
    const quarterEnd = new Date(Date.UTC(year, month + 3, 0, 23, 59, 59, 999));
    return (
      start.getUTCMonth() === month &&
      start.getUTCDate() === 1 &&
      end.getUTCMonth() === quarterEnd.getUTCMonth() &&
      end.getUTCDate() === quarterEnd.getUTCDate()
    );
  });

  return match ? `${year}-${match.label}` : null;
}
