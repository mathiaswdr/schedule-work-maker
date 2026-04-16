import type { Metadata } from "next";
import Link from "next/link";
import { DM_Serif_Display, Space_Grotesk } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import ScrollSectionButton from "@/components/ui/scroll-section-button";
import {
  absoluteUrl,
  buildMarketingMetadata,
  serializeJsonLd,
} from "@/lib/seo";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { PricingCards } from "./pricing-cards";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_SECTION_OFFSET = -112;

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

  return buildMarketingMetadata({
    title: "Tarifs Kronoma | Suivi du temps, facturation et QR-facture suisse",
    description:
      "Comparez les tarifs de Kronoma pour le suivi du temps freelance, la facturation suisse et la QR-facture suisse. Commencez gratuitement puis passez au plan Pro.",
    path: "/pricing",
    index: locale === "fr",
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

  const session = await auth();
  let userPlan: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    userPlan = user?.plan ?? "FREE";
  }

  const canonicalUrl = absoluteUrl("/pricing");
  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kronoma",
    url: canonicalUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: locale,
    description: t("hero.subtitle"),
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace(/[^\d.]/g, "") || "0",
      priceCurrency: "CHF",
      description: plan.desc,
      url: canonicalUrl,
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <main className={`${body.className} w-full bg-paper text-ink`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pricingJsonLd) }}
      />
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[320px] w-[320px] sm:h-[380px] sm:w-[380px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.35),transparent_60%)] blur-2xl will-change-transform motion-safe:animate-[float_10s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] h-[320px] w-[320px] sm:h-[460px] sm:w-[460px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.3),transparent_60%)] blur-2xl will-change-transform motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.08)_1px,transparent_0)] bg-[length:18px_18px] opacity-30" />

        <section className="mx-auto w-full maxW px-6 pb-10 pt-32 text-center">
          <p className="text-xs uppercase text-ink-muted">
            {t("hero.eyebrow")}
          </p>
          <h1
            className={`${display.className} mt-4 text-4xl font-semibold text-ink sm:text-5xl`}
          >
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/login"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px]"
            >
              {t("hero.ctaPrimary")}
            </Link>
            <ScrollSectionButton
              pagePath="/"
              sectionId="demo"
              offsetY={SITE_SECTION_OFFSET}
              className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            >
              {t("hero.ctaSecondary")}
            </ScrollSectionButton>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 pb-16">
          <PricingCards
            plans={plans}
            userPlan={userPlan}
            ctaLabelTemplate={t("cta", { plan: "{plan}" })}
            ctaCurrentLabel={t("ctaCurrent")}
            ctaManageLabel={t("ctaManage")}
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

        <section className="mx-auto w-full maxW px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs uppercase text-ink-muted">
                {t("included.eyebrow")}
              </p>
              <h2
                className={`${display.className} mt-4 text-3xl font-semibold text-ink`}
              >
                {t("included.title")}
              </h2>
              <p className="mt-3 text-ink-muted">
                {t("included.subtitle")}
              </p>
              <div className="mt-6 grid gap-3 text-sm text-ink-muted sm:grid-cols-2">
                {includedItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-2xl border border-line bg-white/70 px-4 py-3"
                  >
                    <span className="h-2 w-2 rounded-full bg-brand-2" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6 shadow-[0_28px_60px_-48px_rgba(15,118,110,0.5)]">
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
                    className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3"
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

        <section className="mx-auto w-full maxW px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs uppercase text-ink-muted">
                {t("migration.eyebrow")}
              </p>
              <h2
                className={`${display.className} mt-4 text-3xl font-semibold text-ink`}
              >
                {t("migration.title")}
              </h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                {t("migration.subtitle")}
              </p>
              <div className="mt-6 grid gap-3">
                {migrationItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm text-ink-muted"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px]"
                >
                  {t("migration.cta")}
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-line bg-white/85 p-6 shadow-[0_30px_80px_-56px_rgba(15,118,110,0.45)]">
              <div className="rounded-3xl border border-line bg-panel px-5 py-4">
                <p className="text-xs uppercase text-ink-muted">
                  {t("migration.demo.label")}
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Acme Studio", "contact@acme.ch", "Lausanne"],
                    ["Nord Conseil", "hello@nord.fr", "Lyon"],
                    ["Atelier 27", "bonjour@atelier27.ch", "Geneve"],
                  ].map(([name, email, city]) => (
                    <div
                      key={name}
                      className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm"
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

              <div className="rounded-3xl border border-line bg-white px-5 py-5">
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

        <section className="mx-auto w-full maxW px-6 pb-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-line bg-white/70 px-5 py-4"
              >
                <p className="text-sm font-semibold text-ink">
                  {item.q}
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 pb-24">
          <div className="rounded-[32px] border border-line bg-brand-2/10 px-6 py-12 text-center sm:px-12">
            <p className="text-xs uppercase text-ink-muted">
              {t("closing.eyebrow")}
            </p>
            <h2
              className={`${display.className} mt-4 text-3xl font-semibold text-ink sm:text-4xl`}
            >
              {t("closing.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-muted">
              {t("closing.subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/login"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px]"
              >
                {t("closing.ctaPrimary")}
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {t("closing.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
