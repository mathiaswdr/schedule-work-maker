import type { Metadata } from "next";

export const SITE_NAME = "Kronoma";
export const SITE_LOCALE = "fr_CH";

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_URL?.trim() || DEFAULT_SITE_URL;
  return new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, getSiteUrl()).toString();
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
};

export function buildMarketingMetadata({
  title,
  description,
  path,
  index = true,
}: MarketingMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: buildRobots(index),
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
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
