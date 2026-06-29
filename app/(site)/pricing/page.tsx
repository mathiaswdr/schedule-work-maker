import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FileSpreadsheet, HelpCircle } from "lucide-react";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { Button } from "@/components/ui/button";
import ScrollSectionButton from "@/components/ui/scroll-section-button";
import {
  buildMarketingMetadata,
  localizedAbsoluteUrl,
  serializeJsonLd,
} from "@/lib/seo";
import { buildSignupCheckoutHref } from "@/lib/checkout-intent";
import { localizedPath } from "@/lib/i18n-routing";
import {
  getCountryFromHeaders,
  getPricingCurrency,
} from "@/lib/pricing-currency";
import { getPlanCurrencyPrice, type PlanId } from "@/lib/plans";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { PricingCards } from "./pricing-cards";

const SITE_SECTION_OFFSET = -112;
const sectionLabel =
  "text-xs font-semibold uppercase tracking-[0.18em] text-brand";
const sectionTitle =
  "mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl";
const sectionIntro = "mt-4 max-w-2xl text-base leading-7 text-ink-muted";

type PricingPlan = {
  name: string;
  planId: string;
  price: string;
  suffix?: string;
  desc: string;
  perks: string[];
  highlight?: boolean;
};

type FaqItem = {
  q: string;
  a: string;
};

type StatItem = {
  label: string;
  value: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isEnglish = locale === "en";

  return buildMarketingMetadata({
    title: isEnglish
      ? "Kronoma Pricing | Time tracking and international invoicing"
      : "Tarifs Kronoma | Suivi du temps et facturation internationale",
    description: isEnglish
      ? "Compare Kronoma plans for freelance time tracking, international invoicing, and Swiss QR-bill workflows. Start free, then upgrade to Pro."
      : "Comparez les tarifs de Kronoma pour le suivi du temps freelance, la facturation internationale et la QR-facture pour les profils suisses. Commencez gratuitement puis passez au plan Pro.",
    path: "/pricing",
    locale,
  });
}

export default async function PricingPage() {
  const locale = await getLocale();
  const t = await getTranslations("pricingPage");
  const plans = t.raw("plans") as PricingPlan[];
  const includedItems = t.raw("included.items") as string[];
  const migrationItems = t.raw("migration.items") as string[];
  const exampleStats = t.raw("example.stats") as StatItem[];
  const faqItems = t.raw("faq.items") as FaqItem[];
  const requestHeaders = await headers();
  const pricingCurrency = getPricingCurrency({
    country: getCountryFromHeaders(requestHeaders),
    locale,
  });

  const session = await auth();
  let userPlan: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    userPlan = user?.plan ?? "FREE";
  }

  const canonicalUrl = localizedAbsoluteUrl("/pricing", locale);
  const pricingJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Kronoma",
      url: canonicalUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: locale,
      description: t("hero.subtitle"),
      offers: plans.map((plan) => {
        const planPrice = getPlanCurrencyPrice(plan.planId as PlanId, pricingCurrency);
        return {
          "@type": "Offer",
          name: plan.name,
          price: String(planPrice.priceAmount),
          priceCurrency: pricingCurrency,
          description: plan.desc,
          url: canonicalUrl,
          availability: "https://schema.org/InStock",
        };
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-white text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pricingJsonLd) }}
      />
      <div className="relative w-full overflow-hidden">
        <section className="relative mx-auto flex w-full maxW flex-col items-center px-6 pb-12 pt-28 text-center sm:pt-32 lg:pb-16 lg:pt-36">
          <p className={sectionLabel}>{t("hero.eyebrow")}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
            <AnimatedGradientText>{t("hero.title")}</AnimatedGradientText>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(249,115,22,0.95)] hover:bg-brand/90"
            >
              <Link href={localizedPath(buildSignupCheckoutHref("PRO", "monthly", pricingCurrency), locale)}>
                {t("hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-line-strong bg-white/70 px-6 text-sm font-semibold text-ink hover:bg-white"
            >
              <ScrollSectionButton
                pagePath="/"
                sectionId="demo"
                offsetY={SITE_SECTION_OFFSET}
              >
                {t("hero.ctaSecondary")}
              </ScrollSectionButton>
            </Button>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 pb-16">
          <PricingCards
            plans={plans}
            currency={pricingCurrency}
            locale={locale}
            userPlan={userPlan}
            ctaLabelTemplate={t("cta", { plan: "{plan}" })}
            ctaFreeLabel={t("ctaFree")}
            ctaTrialLabel={t("ctaTrial", { plan: "{plan}" })}
            ctaLifetimeLabel={t("ctaLifetime", { plan: "{plan}" })}
            ctaCurrentLabel={t("ctaCurrent")}
            ctaManageLabel={t("ctaManage")}
            freeNote={t("planNotes.free")}
            trialNote={t("planNotes.trial")}
            lifetimeNote={t("planNotes.lifetime")}
            toggleMonthly={t("billingToggle.monthly")}
            toggleYearly={t("billingToggle.yearly")}
            toggleBadge={t("billingToggle.badge")}
            toggleHint={t("billingToggle.yearlyHint")}
            suffixMonthly={t("billingToggle.suffixMonthly")}
            suffixYearly={t("billingToggle.suffixYearly")}
            monthlyHint={t("billingToggle.monthlyHint")}
            yearlyEquivalent={t("billingToggle.yearlyEquivalent")}
          />
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="grid gap-10 rounded-[28px] border border-line bg-white p-6 shadow-[0_28px_80px_-66px_rgba(29,27,22,0.42)] lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <div>
              <p className={sectionLabel}>{t("included.eyebrow")}</p>
              <h2 className={sectionTitle}>{t("included.title")}</h2>
              <p className={sectionIntro}>{t("included.subtitle")}</p>
              <div className="mt-7 grid gap-3 text-sm text-ink-muted sm:grid-cols-2">
                {includedItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-neutral-50 px-4 py-3"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_20px_60px_-52px_rgba(29,27,22,0.55)]">
              <p className="text-sm font-semibold text-ink">
                {t("example.title")}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {t("example.subtitle")}
              </p>
              <div className="mt-5 space-y-4">
                {exampleStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-neutral-50 px-4 py-3"
                  >
                    <span className="text-sm text-ink-muted">
                      {stat.label}
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="grid gap-8 overflow-hidden rounded-[28px] border border-line bg-ink p-6 text-white shadow-[0_28px_90px_-62px_rgba(29,27,22,0.85)] lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                {t("migration.eyebrow")}
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                {t("migration.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                {t("migration.subtitle")}
              </p>
              <div className="mt-6 grid gap-3">
                {migrationItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button
                  asChild
                  className="h-11 rounded-full bg-brand px-5 text-white hover:bg-brand/90"
                >
                  <Link href={localizedPath(buildSignupCheckoutHref(), locale)}>
                    {t("migration.cta")}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-ink">
              <div className="rounded-2xl border border-line bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    {t("migration.demo.label")}
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Acme Studio", "contact@acme.ch", "Lausanne"],
                    ["Nord Conseil", "hello@nord.fr", "Lyon"],
                    ["Atelier 27", "bonjour@atelier27.ch", "Geneve"],
                  ].map(([name, email, city]) => (
                    <div
                      key={name}
                      className="grid gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm sm:grid-cols-[1.1fr_1.2fr_0.8fr]"
                    >
                      <span className="font-medium text-ink">{name}</span>
                      <span className="truncate text-ink-muted">{email}</span>
                      <span className="truncate text-ink-muted">{city}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="my-4 flex items-center justify-center">
                <div className="rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
                  {t("migration.demo.arrow")}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white px-5 py-5">
                <p className="text-sm font-semibold text-ink">
                  {t("migration.demo.resultTitle")}
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {t("migration.demo.resultSubtitle")}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-line bg-panel px-4 py-3">
                    <p className="text-xs uppercase text-ink-muted">
                      {t("migration.demo.created")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-ink">3</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel px-4 py-3">
                    <p className="text-xs uppercase text-ink-muted">
                      {t("migration.demo.manual")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-ink">0</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel px-4 py-3">
                    <p className="text-xs uppercase text-ink-muted">
                      {t("migration.demo.time")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-ink">
                      {t("migration.demo.timeValue")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className={sectionLabel}>FAQ</p>
              <h2 className={sectionTitle}>
                {locale === "en" ? "Common questions." : "Questions frequentes."}
              </h2>
            </div>
            <div className="grid gap-3">
              {faqItems.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-line bg-white px-5 py-4 shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-1 h-4 w-4 shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-semibold leading-6 text-ink">
                        {item.q}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="overflow-hidden rounded-[32px] border border-line bg-ink px-6 py-12 text-center text-white shadow-[0_30px_100px_-65px_rgba(29,27,22,0.9)] sm:px-10 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              {t("closing.eyebrow")}
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
              {t("closing.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">
              {t("closing.subtitle")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-brand px-6 text-white hover:bg-brand/90"
              >
                <Link href={localizedPath(buildSignupCheckoutHref(), locale)}>
                  {t("closing.ctaPrimary")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={localizedPath("/about", locale)}>
                  {t("closing.ctaSecondary")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
