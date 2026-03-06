import PDFDocument from "pdfkit";
import { SwissQRBill } from "swissqrbill/pdf";
import type { Data } from "swissqrbill/types";

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

const COUNTRY_TO_ISO: Record<string, string> = {
  suisse: "CH",
  schweiz: "CH",
  svizzera: "CH",
  switzerland: "CH",
  france: "FR",
  frankreich: "FR",
  deutschland: "DE",
  germany: "DE",
  allemagne: "DE",
  austria: "AT",
  autriche: "AT",
  österreich: "AT",
  italy: "IT",
  italie: "IT",
  italia: "IT",
  italien: "IT",
  liechtenstein: "LI",
  luxembourg: "LU",
  belgique: "BE",
  belgium: "BE",
  belgien: "BE",
  espagne: "ES",
  spain: "ES",
  spanien: "ES",
  portugal: "PT",
  "pays-bas": "NL",
  netherlands: "NL",
  "united kingdom": "GB",
  "royaume-uni": "GB",
};

function toCountryCode(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const mapped = COUNTRY_TO_ISO[trimmed.toLowerCase()];
  return mapped ?? null;
}

export async function generateQrBillPdf(
  data: QrBillData
): Promise<Buffer> {
  const qrData: Data = {
    creditor: {
      account: data.iban.replace(/\s/g, ""),
      name: data.creditorName,
      address: data.creditorAddress,
      zip: data.creditorZip,
      city: data.creditorCity,
      country: data.creditorCountry,
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
    const debtorIso = toCountryCode(data.debtorCountry);
    if (debtorIso) {
      qrData.debtor = {
        name: data.debtorName,
        address: data.debtorAddress,
        zip: data.debtorZip,
        city: data.debtorCity,
        country: debtorIso,
      };
    }
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
