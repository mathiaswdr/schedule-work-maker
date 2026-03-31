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
} from "docx";
import { cookies } from "next/headers";
import {
  getInvoiceTemplateMessages,
  normalizeInvoiceLocale,
} from "@/lib/invoice-i18n";

const FONT = "Calibri";

const lightBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
} as const;

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
} as const;

function buildBaseTemplate(locale?: string | null): Document {
  const messages = getInvoiceTemplateMessages(locale);
  const children: (Paragraph | Table)[] = [];

  // Company name
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{{companyName}}", bold: true, size: 40, font: FONT })],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{{invoiceNumber}}", color: "888888", size: 20, font: FONT })],
      spacing: { after: 100 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "{{title}}", bold: true, size: 24, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{subject}}", color: "666666", size: 20, font: FONT })], spacing: { after: 200 } }));

  // Sender info
  children.push(new Paragraph({ children: [new TextRun({ text: "{{senderAddress}}", color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{senderEmail}}", color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{senderPhone}}", color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `${messages.labels.siret}: {{senderSiret}}`, color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // Location + Dates
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "{{location}}, ", size: 20, font: FONT }),
        new TextRun({ text: "{{issueDate}}", size: 20, font: FONT }),
      ],
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${messages.labels.due}: {{dueDate}}`, color: "888888", size: 20, font: FONT }),
      ],
      spacing: { after: 200 },
    })
  );

  // Client
  children.push(new Paragraph({ children: [new TextRun({ text: messages.labels.billTo, color: "888888", size: 16, bold: true, font: FONT })], spacing: { before: 100 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{clientName}}", bold: true, size: 22, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{clientAddress}}", color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{clientPostalCode}} {{clientCity}}", color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{clientCountry}}", color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{clientEmail}}", color: "666666", size: 18, font: FONT })] }));
  children.push(new Paragraph({ spacing: { after: 300 } }));

  // Items table header
  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.description, bold: true, size: 18, font: FONT })] })], width: { size: 50, type: WidthType.PERCENTAGE }, borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.quantity, bold: true, size: 18, font: FONT })], alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE }, borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.price, bold: true, size: 18, font: FONT })], alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE }, borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: messages.labels.amount, bold: true, size: 18, font: FONT })], alignment: AlignmentType.RIGHT })], width: { size: 20, type: WidthType.PERCENTAGE }, borders: lightBorder }),
    ],
  });

  // Items loop row (docxtemplater syntax)
  const loopStartRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: "{{#items}}", color: "AAAAAA", size: 16, font: FONT })] })],
        columnSpan: 4,
        borders: noBorder,
      }),
    ],
  });

  const itemRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{{description}}", size: 20, font: FONT })] })], borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{{quantity}}", size: 20, font: FONT })], alignment: AlignmentType.RIGHT })], borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{{unitPrice}}", size: 20, font: FONT })], alignment: AlignmentType.RIGHT })], borders: lightBorder }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{{amount}}", size: 20, font: FONT })], alignment: AlignmentType.RIGHT })], borders: lightBorder }),
    ],
  });

  const loopEndRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: "{{/items}}", color: "AAAAAA", size: 16, font: FONT })] })],
        columnSpan: 4,
        borders: noBorder,
      }),
    ],
  });

  children.push(
    new Table({
      rows: [headerRow, loopStartRow, itemRow, loopEndRow],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  // Totals
  children.push(new Paragraph({ spacing: { before: 200 } }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `${messages.labels.subtotal}: {{subtotal}}`, size: 20, font: FONT })],
      alignment: AlignmentType.RIGHT,
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `${messages.labels.tax} ({{taxRate}}%): {{taxAmount}}`, color: "888888", size: 20, font: FONT })],
      alignment: AlignmentType.RIGHT,
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `${messages.labels.total}: {{total}}`, bold: true, size: 28, font: FONT })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 100 },
    })
  );

  // Notes
  children.push(new Paragraph({ spacing: { before: 400 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: messages.labels.notes, bold: true, color: "888888", size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{notes}}", color: "555555", size: 18, font: FONT })] }));

  // Payment terms
  children.push(new Paragraph({ spacing: { before: 300 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{paymentTerms}}", color: "555555", size: 16, font: FONT })] }));

  // VAT mention
  children.push(new Paragraph({ spacing: { before: 400 } }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{{vatMention}}", color: "AAAAAA", size: 16, font: FONT })],
      alignment: AlignmentType.CENTER,
    })
  );

  // Banking info
  children.push(new Paragraph({ spacing: { before: 400 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{{bankName}}", bold: true, size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `${messages.labels.iban}: {{iban}}`, size: 18, font: FONT })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `${messages.labels.bicSwift}: {{bic}}`, size: 18, font: FONT })] }));

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

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const requestLocale = new URL(request.url).searchParams.get("locale");
  const locale = normalizeInvoiceLocale(
    requestLocale ??
      cookieStore.get("NEXT_LOCALE")?.value ??
      request.headers.get("accept-language")
  );
  const doc = buildBaseTemplate(locale);
  const buffer = await Packer.toBuffer(doc);
  const messages = getInvoiceTemplateMessages(locale);

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${messages.baseTemplateFilename}"`,
    },
  });
}
