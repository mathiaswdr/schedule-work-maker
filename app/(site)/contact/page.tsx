import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { MarketingSeoPage } from "@/components/marketing/marketing-seo-page";
import { getMarketingPage } from "@/lib/marketing-pages";
import { buildMarketingMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = getMarketingPage("contact", locale);
  return buildMarketingMetadata({ ...page, locale });
}

export default async function ContactPage() {
  const locale = await getLocale();
  const page = getMarketingPage("contact", locale);
  return <MarketingSeoPage page={page} locale={locale} />;
}
