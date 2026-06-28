import type { Metadata } from "next";
import {
  type AppLocale,
  defaultLocale,
  localeMetadata,
  locales,
  normalizeLocale,
  localizedPath,
} from "@/lib/i18n-routing";

export const SITE_NAME = "Kronoma";
export const SITE_LOCALE = localeMetadata[defaultLocale].ogLocale;

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const configuredUrl = process.env.NEXT_PUBLIC_URL?.trim();
  const baseUrl = configuredUrl || (vercelUrl ? `https://${vercelUrl}` : DEFAULT_SITE_URL);

  if (process.env.VERCEL_ENV === "production" && baseUrl === DEFAULT_SITE_URL) {
    throw new Error("NEXT_PUBLIC_URL must be set to the production site URL.");
  }

  return new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, getSiteUrl()).toString();
}

export function localizedAbsoluteUrl(path = "/", locale?: string | null) {
  return absoluteUrl(localizedPath(path, normalizeLocale(locale)));
}

export function localizedAlternates(path: string) {
  return locales.reduce<Record<string, string>>(
    (languages, locale) => ({
      ...languages,
      [localeMetadata[locale].htmlLang]: localizedAbsoluteUrl(path, locale),
    }),
    {
      "x-default": localizedAbsoluteUrl(path, defaultLocale),
    },
  );
}

export function buildRobots(index: boolean): Metadata["robots"] {
  return {
    index,
    follow: index,
    googleBot: {
      index,
      follow: index,
    },
  };
}

type MarketingMetadataOptions = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  locale?: AppLocale | string | null;
};

export function buildMarketingMetadata({
  title,
  description,
  path,
  index = true,
  locale,
}: MarketingMetadataOptions): Metadata {
  const normalizedLocale = normalizeLocale(locale);
  const canonical = localizedAbsoluteUrl(path, normalizedLocale);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: localizedAlternates(path),
    },
    robots: buildRobots(index),
    openGraph: {
      type: "website",
      locale: localeMetadata[normalizedLocale].ogLocale,
      alternateLocale: locales
        .filter((entry) => entry !== normalizedLocale)
        .map((entry) => localeMetadata[entry].ogLocale),
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
