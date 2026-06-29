import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import NavClient from "./nav-client";
import { buildSignupCheckoutHref } from "@/lib/checkout-intent";
import { getCountryFromHeaders, getPricingCurrency } from "@/lib/pricing-currency";

export default async function Nav() {
  const [session, t, locale, requestHeaders] = await Promise.all([
    auth(),
    getTranslations("nav"),
    getLocale(),
    headers(),
  ]);
  const pricingCurrency = getPricingCurrency({
    country: getCountryFromHeaders(requestHeaders),
    locale,
  });

  return (
    <NavClient
      user={session?.user ?? null}
      trialHref={buildSignupCheckoutHref("PRO", "monthly", pricingCurrency)}
      labels={{
        home: t("home"),
        features: t("features"),
        pricing: t("pricing"),
        blog: t("blog"),
        about: t("about"),
        faq: t("faq"),
        login: t("login"),
        trial: t("trial"),
        dashboard: t("dashboard"),
        menu: t("menu"),
      }}
    />
  );
}
