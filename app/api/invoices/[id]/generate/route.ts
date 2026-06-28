import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { NextResponse } from "next/server";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { generateInvoiceDocx } from "@/lib/invoice-docx";
import { generateQrBillPdf } from "@/lib/invoice-qrbill";
import { mergePdfs } from "@/lib/pdf-merge";
import type { QrBillData } from "@/lib/invoice-qrbill";
import { normalizeInvoiceLocale } from "@/lib/invoice-i18n";
import { isSwissCountry, supportsSwissQrBill } from "@/lib/country";
import { cookies } from "next/headers";

type InvoiceFormat = "pdf" | "docx" | "qrbill";

type GenerateInvoiceOptions = {
  format: InvoiceFormat;
  bodyQrData?: QrBillData;
  bodyLocale?: string;
  disposition?: "attachment" | "inline";
};

function contentDisposition(
  disposition: GenerateInvoiceOptions["disposition"],
  filename: string
) {
  return `${disposition ?? "attachment"}; filename="${filename}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get("format");
  const format: InvoiceFormat =
    formatParam === "docx" || formatParam === "qrbill" ? formatParam : "pdf";

  return generateInvoiceResponse(request, params, {
    format,
    bodyLocale: searchParams.get("locale") ?? undefined,
    disposition:
      searchParams.get("disposition") === "inline" ? "inline" : "attachment",
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const {
    format,
    qrData: bodyQrData,
    locale: bodyLocale,
  } = (await request.json()) as {
    format: InvoiceFormat;
    qrData?: QrBillData;
    locale?: string;
  };

  return generateInvoiceResponse(request, params, {
    format,
    bodyQrData,
    bodyLocale,
    disposition: "attachment",
  });
}

async function generateInvoiceResponse(
  request: Request,
  params: Promise<{ id: string }>,
  {
    format,
    bodyQrData,
    bodyLocale,
    disposition = "attachment",
  }: GenerateInvoiceOptions
) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const locale = normalizeInvoiceLocale(
    bodyLocale ??
      cookieStore.get("NEXT_LOCALE")?.value ??
      request.headers.get("accept-language")
  );

  const [invoice, businessProfile] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customTemplate: true,
        user: { select: { currency: true } },
      },
    }),
    prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
      select: { country: true },
    }),
  ]);

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Uploaded invoices: QR-bill generation with client-provided data
  if (invoice.source === "UPLOADED" && format === "qrbill" && bodyQrData) {
    const canUseQrBill = supportsSwissQrBill({
      country: businessProfile?.country,
      currency: invoice.user.currency,
    });

    if (!canUseQrBill || !isSwissCountry(bodyQrData.creditorCountry)) {
      return NextResponse.json(
        { error: "QR-bill is only available for Swiss CHF profiles" },
        { status: 403 }
      );
    }

    try {
      const qrBuffer = await generateQrBillPdf(bodyQrData);
      return new Response(qrBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": contentDisposition(
            disposition,
            `${invoice.displayNumber}-qr.pdf`
          ),
        },
      });
    } catch (err) {
      console.error("QR-bill generation failed:", err);
      return NextResponse.json(
        { error: "QR-bill generation failed" },
        { status: 500 }
      );
    }
  }

  // Uploaded invoices: proxy the stored file directly when available.
  // Demo seed data may point to placeholder URLs, so fall through to PDF
  // generation if the stored file cannot be fetched.
  if (invoice.source === "UPLOADED" && invoice.fileUrl && format === "pdf") {
    try {
      const fileRes = await fetch(invoice.fileUrl);
      if (fileRes.ok) {
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        const contentType =
          fileRes.headers.get("content-type") || "application/octet-stream";
        const ext = contentType.includes("pdf")
          ? ".pdf"
          : contentType.includes("png")
            ? ".png"
            : contentType.includes("jpeg") || contentType.includes("jpg")
              ? ".jpg"
              : "";

        return new Response(buffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": contentDisposition(
              disposition,
              `${invoice.displayNumber}${ext}`
            ),
          },
        });
      }
    } catch {
      // Fallback below generates a downloadable PDF from invoice metadata.
    }
  }

  const invoiceData = {
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
    currency: invoice.user.currency,
    templateType: invoice.templateType,
    items: invoice.items.map((item) => ({
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
  };

  // Build QR-bill data if IBAN is present and sender address is complete
  const buildQrBillData = (): QrBillData | null => {
    const inv = invoice!;
    if (
      !supportsSwissQrBill({
        country: inv.senderCountry,
        currency: inv.user.currency,
      }) ||
      !inv.iban ||
      !inv.senderName ||
      !inv.senderAddress ||
      !inv.senderPostalCode ||
      !inv.senderCity ||
      !inv.senderCountry
    ) {
      return null;
    }
    return {
      iban: inv.iban,
      creditorName: inv.senderName,
      creditorAddress: inv.senderAddress,
      creditorZip: inv.senderPostalCode,
      creditorCity: inv.senderCity,
      creditorCountry: inv.senderCountry,
      amount: inv.total > 0 ? inv.total : undefined,
      debtorName: inv.clientName || undefined,
      debtorAddress: inv.clientAddress || undefined,
      debtorZip: inv.clientPostalCode || undefined,
      debtorCity: inv.clientCity || undefined,
      debtorCountry: inv.clientCountry || undefined,
      message: inv.displayNumber,
    };
  };

  // Fetch custom template .docx if applicable
  let customTemplateBuffer: Buffer | undefined;
  if (
    invoice.templateType === "CUSTOM" &&
    invoice.customTemplate?.fileUrl
  ) {
    try {
      const res = await fetch(invoice.customTemplate.fileUrl);
      if (res.ok) {
        customTemplateBuffer = Buffer.from(await res.arrayBuffer());
      }
    } catch {
      // Fallback to built-in template if fetch fails
    }
  }

  if (format === "qrbill") {
    const qrData = buildQrBillData();
    if (!qrData) {
      return NextResponse.json(
        { error: "Missing IBAN or sender address for QR-bill" },
        { status: 400 }
      );
    }
    try {
      const qrBuffer = await generateQrBillPdf(qrData);
      return new Response(qrBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": contentDisposition(
            disposition,
            `${invoice.displayNumber}-qr.pdf`
          ),
        },
      });
    } catch (err) {
      console.error("QR-bill generation failed:", err, "Data:", JSON.stringify(qrData));
      return NextResponse.json(
        { error: "QR-bill generation failed" },
        { status: 500 }
      );
    }
  }

  if (format === "pdf") {
    const pdfBuffer = await generateInvoicePdf(invoiceData, locale);

    // If QR-bill data is available, append it as a separate page
    const qrData = buildQrBillData();
    if (qrData) {
      try {
        const qrBuffer = await generateQrBillPdf(qrData);
        const mergedBuffer = await mergePdfs([pdfBuffer, qrBuffer]);
        return new Response(mergedBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": contentDisposition(
              disposition,
              `${invoice.displayNumber}.pdf`
            ),
          },
        });
      } catch {
        // The invoice PDF should remain downloadable even if QR-bill data is invalid.
      }
    }

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(
          disposition,
          `${invoice.displayNumber}.pdf`
        ),
      },
    });
  }

  if (format === "docx") {
    const docxBuffer = await generateInvoiceDocx(
      invoiceData,
      customTemplateBuffer,
      locale
    );
    return new Response(docxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": contentDisposition(
          disposition,
          `${invoice.displayNumber}.docx`
        ),
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
