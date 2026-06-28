const COUNTRY_ALIASES: Record<string, string> = {
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
  osterreich: "AT",
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

const EURO_COUNTRIES = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
]);

export const COUNTRY_OPTIONS = [
  { code: "CH", en: "Switzerland", fr: "Suisse" },
  { code: "FR", en: "France", fr: "France" },
  { code: "BE", en: "Belgium", fr: "Belgique" },
  { code: "DE", en: "Germany", fr: "Allemagne" },
  { code: "IT", en: "Italy", fr: "Italie" },
  { code: "ES", en: "Spain", fr: "Espagne" },
  { code: "NL", en: "Netherlands", fr: "Pays-Bas" },
  { code: "GB", en: "United Kingdom", fr: "Royaume-Uni" },
  { code: "US", en: "United States", fr: "Etats-Unis" },
  { code: "CA", en: "Canada", fr: "Canada" },
  { code: "AU", en: "Australia", fr: "Australie" },
] as const;

export const SUPPORTED_CURRENCIES = [
  { code: "CHF", en: "Swiss franc", fr: "Franc suisse" },
  { code: "EUR", en: "Euro", fr: "Euro" },
  { code: "USD", en: "US dollar", fr: "Dollar US" },
  { code: "GBP", en: "British pound", fr: "Livre sterling" },
  { code: "CAD", en: "Canadian dollar", fr: "Dollar canadien" },
  { code: "AUD", en: "Australian dollar", fr: "Dollar australien" },
  { code: "JPY", en: "Yen", fr: "Yen" },
] as const;

export type CountryUiLocale = "en" | "fr";

type CountryBusinessProfile = {
  country: string | null;
  currency: string;
  taxIdLabel: string;
  taxIdPlaceholder: string;
  taxLabel: string;
  taxRateLabel: string;
  taxMentionLabel: string;
  taxMentionPlaceholder: string;
  bankAccountLabel: string;
  bankAccountPlaceholder: string;
  bankCodeLabel: string;
  bankCodePlaceholder: string;
  paymentTermsPlaceholder: string;
};

export function normalizeCountryCode(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return COUNTRY_ALIASES[trimmed.toLowerCase()] ?? null;
}

export function isSwissCountry(value?: string | null): boolean {
  return normalizeCountryCode(value) === "CH";
}

export function supportsSwissQrBill({
  country,
  currency,
}: {
  country?: string | null;
  currency?: string | null;
}): boolean {
  return isSwissCountry(country) && currency?.trim().toUpperCase() === "CHF";
}

export function getDefaultCurrencyForCountry(country?: string | null): string {
  const code = normalizeCountryCode(country);
  if (code === "CH" || code === "LI") return "CHF";
  if (code === "GB") return "GBP";
  if (code === "US") return "USD";
  if (code === "CA") return "CAD";
  if (code === "AU") return "AUD";
  if (code && EURO_COUNTRIES.has(code)) return "EUR";
  return "USD";
}

export function getCountryOptionLabel(
  country: string,
  locale: CountryUiLocale
) {
  const option = COUNTRY_OPTIONS.find((item) => item.code === country);
  return option ? `${option.code} - ${option[locale]}` : country;
}

export function getCurrencyOptionLabel(
  currency: string,
  locale: CountryUiLocale
) {
  const option = SUPPORTED_CURRENCIES.find((item) => item.code === currency);
  return option ? `${option.code} - ${option[locale]}` : currency;
}

export function getBusinessProfileForCountry(
  country?: string | null,
  locale: CountryUiLocale = "en"
): CountryBusinessProfile {
  const code = normalizeCountryCode(country);
  const isFrench = locale === "fr";
  const defaultProfile: CountryBusinessProfile = {
    country: code,
    currency: getDefaultCurrencyForCountry(code),
    taxIdLabel: isFrench ? "ID fiscal / entreprise" : "Tax ID / business ID",
    taxIdPlaceholder: isFrench
      ? "Numero TVA, registre ou identifiant local"
      : "VAT number, registry number, or local tax ID",
    taxLabel: isFrench ? "Taxe" : "Tax",
    taxRateLabel: isFrench ? "Taux de taxe (%)" : "Tax rate (%)",
    taxMentionLabel: isFrench ? "Mention fiscale" : "Tax mention",
    taxMentionPlaceholder: isFrench
      ? "Taxe non applicable, autoliquidation, exonere..."
      : "Tax not applicable, reverse charge, exempt...",
    bankAccountLabel: isFrench ? "Compte / IBAN" : "Account / IBAN",
    bankAccountPlaceholder: isFrench
      ? "IBAN ou numero de compte"
      : "IBAN or account number",
    bankCodeLabel: isFrench ? "Code banque / SWIFT" : "Bank code / SWIFT",
    bankCodePlaceholder: isFrench
      ? "BIC, SWIFT, routing number..."
      : "BIC, SWIFT, routing number...",
    paymentTermsPlaceholder: isFrench
      ? "Paiement sous 30 jours par virement, carte ou lien de paiement..."
      : "Payment within 30 days by bank transfer, card, or payment link...",
  };

  if (code === "CH") {
    return {
      ...defaultProfile,
      taxIdLabel: isFrench ? "IDE / UID / TVA" : "UID / VAT number",
      taxIdPlaceholder: "CHE-123.456.789",
      taxLabel: isFrench ? "TVA" : "VAT",
      taxRateLabel: isFrench ? "Taux de TVA (%)" : "VAT rate (%)",
      taxMentionLabel: isFrench ? "Mention TVA" : "VAT mention",
      taxMentionPlaceholder: isFrench
        ? "Non assujetti a la TVA selon l'art. 10 LTVA."
        : "Not subject to VAT under Swiss VAT rules.",
      bankAccountLabel: "IBAN",
      bankAccountPlaceholder: "CH00 0000 0000 0000 0000 0",
      bankCodeLabel: "BIC / SWIFT",
      bankCodePlaceholder: "POFICHBEXXX",
    };
  }

  if (code === "FR") {
    return {
      ...defaultProfile,
      taxIdLabel: "SIRET / TVA",
      taxIdPlaceholder: "123 456 789 00012",
      taxLabel: "TVA",
      taxRateLabel: isFrench ? "Taux de TVA (%)" : "VAT rate (%)",
      taxMentionLabel: isFrench ? "Mention TVA" : "VAT mention",
      taxMentionPlaceholder: isFrench
        ? "TVA non applicable, art. 293B du CGI"
        : "VAT not applicable, art. 293B of the French tax code",
      bankAccountLabel: "IBAN",
      bankAccountPlaceholder: "FR76 0000 0000 0000 0000 0000 000",
      bankCodeLabel: "BIC / SWIFT",
      bankCodePlaceholder: "AGRIFRPPXXX",
    };
  }

  if (code && EURO_COUNTRIES.has(code)) {
    return {
      ...defaultProfile,
      taxIdLabel: isFrench ? "Numero TVA" : "VAT number",
      taxIdPlaceholder: `${code}123456789`,
      taxLabel: isFrench ? "TVA" : "VAT",
      taxRateLabel: isFrench ? "Taux de TVA (%)" : "VAT rate (%)",
      taxMentionLabel: isFrench ? "Mention TVA" : "VAT mention",
      bankAccountLabel: "IBAN",
      bankAccountPlaceholder: `${code}00 0000 0000 0000 0000`,
      bankCodeLabel: "BIC / SWIFT",
      bankCodePlaceholder: "BANKXXXX",
    };
  }

  if (code === "US") {
    return {
      ...defaultProfile,
      taxIdLabel: "EIN / Tax ID",
      taxIdPlaceholder: "12-3456789",
      taxLabel: isFrench ? "Sales tax" : "Sales tax",
      taxRateLabel: isFrench ? "Taux de sales tax (%)" : "Sales tax rate (%)",
      taxMentionLabel: isFrench ? "Mention fiscale" : "Tax mention",
      bankAccountLabel: isFrench ? "Numero de compte" : "Account number",
      bankAccountPlaceholder: "123456789",
      bankCodeLabel: isFrench ? "Routing / SWIFT" : "Routing / SWIFT",
      bankCodePlaceholder: "021000021",
    };
  }

  if (code === "GB") {
    return {
      ...defaultProfile,
      taxIdLabel: isFrench ? "VAT / Company number" : "VAT / Company number",
      taxIdPlaceholder: "GB123456789",
      taxLabel: isFrench ? "VAT" : "VAT",
      taxRateLabel: isFrench ? "Taux de VAT (%)" : "VAT rate (%)",
      bankAccountLabel: isFrench ? "IBAN / Account number" : "IBAN / Account number",
      bankAccountPlaceholder: "GB00 BANK 0000 0000 0000 00",
      bankCodeLabel: isFrench ? "Sort code / SWIFT" : "Sort code / SWIFT",
      bankCodePlaceholder: "00-00-00",
    };
  }

  return defaultProfile;
}
