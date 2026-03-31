export const invoiceLocales = ["fr", "en"] as const;

export type InvoiceLocale = (typeof invoiceLocales)[number];

type InvoiceTemplateMessages = {
  baseTemplateFilename: string;
  fallbackTitle: string;
  labels: {
    amount: string;
    billTo: string;
    bicSwift: string;
    date: string;
    description: string;
    due: string;
    from: string;
    iban: string;
    locationAndDate: string;
    notes: string;
    price: string;
    quantity: string;
    siret: string;
    subtotal: string;
    tax: string;
    to: string;
    total: string;
  };
};

const invoiceMessages: Record<InvoiceLocale, InvoiceTemplateMessages> = {
  fr: {
    baseTemplateFilename: "modele-facture-base-fr.docx",
    fallbackTitle: "Facture",
    labels: {
      amount: "MONTANT",
      billTo: "FACTURER A",
      bicSwift: "BIC/SWIFT",
      date: "DATE",
      description: "DESCRIPTION",
      due: "ECHEANCE",
      from: "EMETTEUR",
      iban: "IBAN",
      locationAndDate: "LIEU & DATE",
      notes: "NOTES",
      price: "PRIX",
      quantity: "QTE",
      siret: "SIRET",
      subtotal: "Sous-total",
      tax: "TVA",
      to: "FACTURER A",
      total: "Total",
    },
  },
  en: {
    baseTemplateFilename: "invoice-template-base-en.docx",
    fallbackTitle: "Invoice",
    labels: {
      amount: "AMOUNT",
      billTo: "BILL TO",
      bicSwift: "BIC/SWIFT",
      date: "DATE",
      description: "DESCRIPTION",
      due: "DUE",
      from: "FROM",
      iban: "IBAN",
      locationAndDate: "LOCATION & DATE",
      notes: "NOTES",
      price: "PRICE",
      quantity: "QTY",
      siret: "SIRET",
      subtotal: "Subtotal",
      tax: "Tax",
      to: "TO",
      total: "Total",
    },
  },
};

export function normalizeInvoiceLocale(locale?: string | null): InvoiceLocale {
  if (!locale) return "fr";

  const normalized = locale
    .split(",")[0]
    ?.trim()
    .split(";")[0]
    ?.trim()
    .split(/[-_]/)[0]
    ?.toLowerCase();

  return normalized === "en" ? "en" : "fr";
}

export function getInvoiceTemplateMessages(
  locale?: string | null
): InvoiceTemplateMessages {
  return invoiceMessages[normalizeInvoiceLocale(locale)];
}

export function formatInvoiceDate(
  dateValue: Date | string | null,
  locale?: string | null
): string {
  if (!dateValue) return "—";

  const date =
    typeof dateValue === "string" ? new Date(dateValue) : dateValue;

  return new Intl.DateTimeFormat(normalizeInvoiceLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
