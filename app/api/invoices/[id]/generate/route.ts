import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { NextResponse } from "next/server";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { generateInvoiceDocx } from "@/lib/invoice-docx";
import { generateQrBillPdf } from "@/lib/invoice-qrbill";
import { mergePdfs } from "@/lib/pdf-merge";
import type { QrBillData } from "@/lib/invoice-qrbill";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { format, qrData: bodyQrData } = (await request.json()) as {
    format: "pdf" | "docx" | "qrbill";
    qrData?: QrBillData;
  };

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customTemplate: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Uploaded invoices: QR-bill generation with client-provided data
  if (invoice.source === "UPLOADED" && format === "qrbill" && bodyQrData) {
    try {
      const qrBuffer = await generateQrBillPdf(bodyQrData);
      return new Response(qrBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.displayNumber}-qr.pdf"`,
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

  // Uploaded invoices: proxy the stored file directly
  if (invoice.source === "UPLOADED" && invoice.fileUrl) {
    try {
      const fileRes = await fetch(invoice.fileUrl);
      if (!fileRes.ok) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
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
          "Content-Disposition": `attachment; filename="${invoice.displayNumber}${ext}"`,
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch uploaded file" },
        { status: 500 }
      );
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
          "Content-Disposition": `attachment; filename="${invoice.displayNumber}-qr.pdf"`,
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
    const pdfBuffer = await generateInvoicePdf(invoiceData);

    // If QR-bill data is available, append it as a separate page
    const qrData = buildQrBillData();
    if (qrData) {
      const qrBuffer = await generateQrBillPdf(qrData);
      const mergedBuffer = await mergePdfs([pdfBuffer, qrBuffer]);
      return new Response(mergedBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.displayNumber}.pdf"`,
        },
      });
    }

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.displayNumber}.pdf"`,
      },
    });
  }

  if (format === "docx") {
    const docxBuffer = await generateInvoiceDocx(invoiceData, customTemplateBuffer);
    return new Response(docxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${invoice.displayNumber}.docx"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
