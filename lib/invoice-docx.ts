import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { InvoiceData } from "./invoice-pdf";
import {
  formatInvoiceDate,
  getInvoiceTemplateMessages,
  normalizeInvoiceLocale,
} from "./invoice-i18n";

const FONT = "Calibri";

const fmt = (n: number) => n.toFixed(2);

/**
 * Pre-processes the template DOCX XML to remove Word artifacts
 * that cause run-splitting and formatting inconsistencies
 * when docxtemplater replaces tags.
 */
function cleanTemplateXml(zip: PizZip): void {
  const xmlFiles = [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
  ];

  for (const path of xmlFiles) {
    const file = zip.file(path);
    if (!file) continue;

    let xml = file.asText();

    // Remove spell-check proof error markers (split runs around misspelled words)
    xml = xml.replace(/<w:proofErr[^>]*\/>/g, "");

    // Remove revision session IDs — Word uses these to track editing sessions
    // and creates separate runs for text typed in different sessions even when
    // the formatting is identical. This is the #1 cause of split {{tags}}.
    xml = xml.replace(/\s+w:rsid\w*="[^"]*"/g, "");

    // Remove lastRenderedPageBreak (rendering hint, not content)
    xml = xml.replace(/<w:lastRenderedPageBreak\/>/g, "");
    xml = xml.replace(/<w:lastRenderedPageBreak\s*\/>/g, "");

    zip.file(path, xml);
  }
}

function groupByCategory(items: InvoiceData["items"]) {
  const groups: { category: string; items: InvoiceData["items"] }[] = [];
  for (const item of items) {
    const cat = item.category || "";
    const existing = groups.find((g) => g.category === cat);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ category: cat, items: [item] });
    }
  }
  return groups;
}

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
} as const;

const lightBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
} as const;

function buildClassicDoc(invoice: InvoiceData, locale?: string | null): Document {
  const groups = groupByCategory(invoice.items);
  const messages = getInvoiceTemplateMessages(locale);
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: invoice.senderName || messages.fallbackTitle,
          bold: true,
          size: 40,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: invoice.displayNumber, color: "888888", size: 20 })],
      spacing: { after: invoice.title || invoice.subject ? 100 : 300 },
    })
  );
  if (invoice.title) {
    children.push(new Paragraph({ children: [new TextRun({ text: invoice.title, bold: true, size: 24 })] }));
  }
  if (invoice.subject) {
    children.push(new Paragraph({ children: [new TextRun({ text: invoice.subject, color: "666666", size: 20 })], spacing: { after: 200 } }));
  }

  // Sender info
  const senderLines = [
    invoice.senderAddress,
    invoice.senderEmail,
    invoice.senderPhone,
    invoice.senderSiret
      ? `${messages.labels.siret}: ${invoice.senderSiret}`
      : null,
  ].filter(Boolean);
  for (const line of senderLines) {
    children.push(new Paragraph({ children: [new TextRun({ text: line!, color: "666666", size: 18 })] }));
  }
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // Location + Dates
  if (invoice.location) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${invoice.location}, ${formatInvoiceDate(invoice.issueDate, locale)}`,
            size: 20,
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${messages.labels.date}: ${formatInvoiceDate(invoice.issueDate, locale)}`,
          size: 20,
        }),
        invoice.dueDate
          ? new TextRun({
              text: `  |  ${messages.labels.due}: ${formatInvoiceDate(
                invoice.dueDate,
                locale
              )}`,
              color: "888888",
              size: 20,
            })
          : new TextRun(""),
      ],
      spacing: { after: 200 },
    })
  );

  // Client
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: messages.labels.billTo,
          color: "888888",
          size: 16,
          bold: true,
        }),
      ],
      spacing: { before: 100 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: invoice.clientName || "—", bold: true, size: 22 })] }));
  if (invoice.clientAddress) {
    children.push(new Paragraph({ children: [new TextRun({ text: invoice.clientAddress, color: "666666", size: 18 })] }));
  }
  if (invoice.clientPostalCode || invoice.clientCity) {
    children.push(new Paragraph({ children: [new TextRun({ text: [invoice.clientPostalCode, invoice.clientCity].filter(Boolean).join(" "), color: "666666", size: 18 })] }));
  }
  if (invoice.clientCountry) {
    children.push(new Paragraph({ children: [new TextRun({ text: invoice.clientCountry, color: "666666", size: 18 })] }));
  }
  if (invoice.clientEmail) {
    children.push(new Paragraph({ children: [new TextRun({ text: invoice.clientEmail, color: "666666", size: 18 })] }));
  }
  children.push(new Paragraph({ spacing: { after: 300 } }));

  // Items table
  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.description, bold: true, size: 18 })] })], width: { size: 50, type: WidthType.PERCENTAGE }, borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.quantity, bold: true, size: 18 })], alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE }, borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.price, bold: true, size: 18 })], alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE }, borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.amount, bold: true, size: 18 })], alignment: AlignmentType.RIGHT })], width: { size: 20, type: WidthType.PERCENTAGE }, borders: lightBorder }),
    ],
  });

  const dataRows: TableRow[] = [];
  for (const group of groups) {
    if (group.category) {
      dataRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: group.category, bold: true, color: "555555", size: 18 })] })],
              columnSpan: 4,
              borders: noBorder,
              shading: { type: ShadingType.SOLID, color: "F9FAFB" },
            }),
          ],
        })
      );
    }
    for (const item of group.items) {
      dataRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 20 })] })], borders: lightBorder }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.quantity), size: 20 })], alignment: AlignmentType.RIGHT })], borders: lightBorder }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(item.unitPrice), size: 20 })], alignment: AlignmentType.RIGHT })], borders: lightBorder }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(item.amount), bold: true, size: 20 })], alignment: AlignmentType.RIGHT })], borders: lightBorder }),
          ],
        })
      );
    }
  }

  children.push(
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  // Totals
  children.push(new Paragraph({ spacing: { before: 200 } }));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${messages.labels.subtotal}: ${fmt(invoice.subtotal)}`,
          size: 20,
        }),
      ],
      alignment: AlignmentType.RIGHT,
    })
  );
  if ((invoice.taxRate ?? 0) > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${messages.labels.tax} (${invoice.taxRate}%): ${fmt(
              invoice.taxAmount
            )}`,
            color: "888888",
            size: 20,
          }),
        ],
        alignment: AlignmentType.RIGHT,
      })
    );
  }
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${messages.labels.total}: ${fmt(invoice.total)}`,
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 100 },
    })
  );

  // Notes
  if (invoice.notes) {
    children.push(new Paragraph({ spacing: { before: 400 } }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: messages.labels.notes,
            bold: true,
            color: "888888",
            size: 18,
          }),
        ],
      })
    );
    children.push(new Paragraph({ children: [new TextRun({ text: invoice.notes, color: "555555", size: 18 })] }));
  }

  // Payment terms
  if (invoice.paymentTerms) {
    children.push(new Paragraph({ spacing: { before: 300 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: invoice.paymentTerms, color: "555555", size: 16 })] }));
  }

  // VAT mention
  if (invoice.senderVatMention) {
    children.push(new Paragraph({ spacing: { before: 400 } }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: invoice.senderVatMention, color: "AAAAAA", size: 16 })],
        alignment: AlignmentType.CENTER,
      })
    );
  }

  // Banking info
  if (invoice.bankName || invoice.iban || invoice.bic) {
    children.push(new Paragraph({ spacing: { before: 400 } }));
    if (invoice.bankName) {
      children.push(new Paragraph({ children: [new TextRun({ text: invoice.bankName, bold: true, size: 18 })] }));
    }
    if (invoice.iban) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${messages.labels.iban}: ${invoice.iban}`,
              size: 18,
            }),
          ],
        })
      );
    }
    if (invoice.bic) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${messages.labels.bicSwift}: ${invoice.bic}`,
              size: 18,
            }),
          ],
        })
      );
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT },
          paragraph: { spacing: { line: 276 } }, // 1.15 line spacing
        },
      },
    },
    sections: [{ children }],
  });
}

function buildFromCustomTemplate(
  invoice: InvoiceData,
  templateBuffer: Buffer,
  locale?: string | null
): Buffer {
  const zip = new PizZip(templateBuffer);

  // Clean Word artifacts that cause run-splitting and formatting loss
  cleanTemplateXml(zip);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    // Tolerate missing/unknown placeholders instead of crashing
    nullGetter() {
      return "";
    },
  });

  const itemsData = invoice.items.map((item) => ({
    category: item.category || "",
    CATEGORY: item.category || "",
    description: item.description,
    quantity: String(item.quantity),
    hours: String(item.quantity),
    unitPrice: fmt(item.unitPrice),
    price: fmt(item.unitPrice),
    amount: fmt(item.amount),
  }));

  try {
    doc.render({
      // Sender
      companyName: invoice.senderName || "",
      senderName: invoice.senderName || "",
      senderAddress: invoice.senderAddress || "",
      senderEmail: invoice.senderEmail || "",
      senderPhone: invoice.senderPhone || "",
      senderSiret: invoice.senderSiret || "",
      vatMention: invoice.senderVatMention || "",
      // Client
      clientName: invoice.clientName || "",
      clientEmail: invoice.clientEmail || "",
      clientAddress: invoice.clientAddress || "",
      clientPostalCode: invoice.clientPostalCode || "",
      clientCity: invoice.clientCity || "",
      clientCountry: invoice.clientCountry || "",
      // Invoice
      invoiceNumber: invoice.displayNumber,
      title: invoice.title || "",
      subject: invoice.subject || "",
      location: invoice.location || "",
      issueDate: formatInvoiceDate(invoice.issueDate, locale),
      dueDate: formatInvoiceDate(invoice.dueDate, locale),
      // Items (for loop: {#items}...{/items})
      items: itemsData,
      // Totals — always pass strings for consistent rendering
      subtotal: fmt(invoice.subtotal),
      taxRate: String(invoice.taxRate ?? 0),
      taxAmount: fmt(invoice.taxAmount),
      total: fmt(invoice.total),
      // Notes
      notes: invoice.notes || "",
      // Banking
      bankName: invoice.bankName || "",
      iban: invoice.iban || "",
      bic: invoice.bic || "",
      // Payment terms
      paymentTerms: invoice.paymentTerms || "",
    });

    return Buffer.from(doc.getZip().generate({ type: "nodebuffer" }));
  } catch {
    // If the template has syntax errors (unclosed tags, etc.),
    // return the original document unchanged rather than crashing
    return templateBuffer;
  }
}

export async function generateInvoiceDocx(
  invoice: InvoiceData,
  customTemplateBuffer?: Buffer,
  locale?: string | null
): Promise<Buffer> {
  const normalizedLocale = normalizeInvoiceLocale(locale);

  // If a custom template buffer is provided, use docxtemplater to fill placeholders
  if (customTemplateBuffer) {
    return buildFromCustomTemplate(
      invoice,
      customTemplateBuffer,
      normalizedLocale
    );
  }

  // Otherwise use the built-in classic layout
  const doc = buildClassicDoc(invoice, normalizedLocale);
  return Buffer.from(await Packer.toBuffer(doc));
}
