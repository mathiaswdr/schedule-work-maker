import PDFDocument from "pdfkit";
import { SwissQRBill } from "swissqrbill/pdf";
import type { Data } from "swissqrbill/types";
import { normalizeCountryCode } from "./country";

export type QrBillData = {
  iban: string;
  creditorName: string;
  creditorAddress: string;
  creditorZip: string | number;
  creditorCity: string;
  creditorCountry: string;
  amount?: number;
  debtorName?: string;
  debtorAddress?: string;
  debtorZip?: string | number;
  debtorCity?: string;
  debtorCountry?: string;
  message?: string;
  language?: "DE" | "EN" | "FR" | "IT";
};

export async function generateQrBillPdf(
  data: QrBillData
): Promise<Buffer> {
  const creditorIso = normalizeCountryCode(data.creditorCountry) ?? data.creditorCountry;

  const qrData: Data = {
    creditor: {
      account: data.iban.replace(/\s/g, ""),
      name: data.creditorName,
      address: data.creditorAddress,
      zip: data.creditorZip,
      city: data.creditorCity,
      country: creditorIso,
    },
    currency: "CHF",
    amount: data.amount,
    message: data.message,
  };

  if (
    data.debtorName &&
    data.debtorAddress &&
    data.debtorZip &&
    data.debtorCity &&
    data.debtorCountry
  ) {
    const debtorIso = normalizeCountryCode(data.debtorCountry) ?? data.debtorCountry;
    qrData.debtor = {
      name: data.debtorName,
      address: data.debtorAddress,
      zip: data.debtorZip,
      city: data.debtorCity,
      country: debtorIso,
    };
  }

  const qrBill = new SwissQRBill(qrData, {
    language: data.language ?? "FR",
  });

  const pdf = new PDFDocument({
    autoFirstPage: false,
    size: "A4",
  });

  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });

  // Add a blank A4 page, then attach the QR-bill at the bottom
  pdf.addPage({ size: "A4" });
  qrBill.attachTo(pdf);
  pdf.end();

  return done;
}
