import { getDefaultCurrencyForCountry, normalizeCountryCode } from "@/lib/country";

export const pricingCurrencies = ["CHF", "EUR", "USD"] as const;
export type PricingCurrency = (typeof pricingCurrencies)[number];

const EURO_LANGUAGE_PREFIXES = new Set(["de", "es", "fr", "it", "nl", "pt"]);
const COUNTRY_HEADER_NAMES = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-country-code",
  "x-appengine-country",
];

export function isPricingCurrency(value: string | null | undefined): value is PricingCurrency {
  return pricingCurrencies.includes(value as PricingCurrency);
}

export function normalizePricingCurrency(value?: string | null): PricingCurrency | null {
  const normalized = value?.trim().toUpperCase();
  return isPricingCurrency(normalized) ? normalized : null;
}

export function getPricingCurrencyForCountry(country?: string | null): PricingCurrency | null {
  const defaultCurrency = getDefaultCurrencyForCountry(country);
  if (defaultCurrency === "CHF" || defaultCurrency === "EUR") {
    return defaultCurrency;
  }
  return normalizeCountryCode(country) ? "USD" : null;
}

export function getPricingCurrencyForLocale(locale?: string | null): PricingCurrency {
  const normalizedLocale = locale?.trim().toLowerCase() || "";
  const [, region] = normalizedLocale.split(/[-_]/);
  const regionCurrency = getPricingCurrencyForCountry(region);

  if (regionCurrency) return regionCurrency;

  const language = normalizedLocale.split(/[-_]/)[0];
  if (EURO_LANGUAGE_PREFIXES.has(language)) return "EUR";
  return "USD";
}

export function getPricingCurrency({
  country,
  locale,
}: {
  country?: string | null;
  locale?: string | null;
}): PricingCurrency {
  return getPricingCurrencyForCountry(country) ?? getPricingCurrencyForLocale(locale);
}

export function getCountryFromHeaders(headers: Headers): string | null {
  for (const header of COUNTRY_HEADER_NAMES) {
    const country = normalizeCountryCode(headers.get(header));
    if (country) return country;
  }

  const acceptLanguage = headers.get("accept-language");
  const acceptedLocales = acceptLanguage?.split(",") ?? [];
  for (const acceptedLocale of acceptedLocales) {
    const [, region] = acceptedLocale.trim().split(";")[0].split(/[-_]/);
    const country = normalizeCountryCode(region);
    if (country) return country;
  }

  return null;
}

export function formatPricingAmount(
  amount: number,
  currency: PricingCurrency,
  locale: string,
) {
  const normalizedLocale = locale === "fr" && currency === "CHF" ? "fr-CH" : locale;
  const hasDecimals = !Number.isInteger(amount);

  return new Intl.NumberFormat(normalizedLocale, {
    style: "currency",
    currency,
    currencyDisplay: currency === "CHF" ? "code" : "symbol",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
