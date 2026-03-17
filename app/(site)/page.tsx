import Link from "next/link";
import { DM_Serif_Display, Space_Grotesk } from "next/font/google";
import { getTranslations } from "next-intl/server";
import ScrollSectionButton from "@/components/ui/scroll-section-button";
import { PricingCards } from "./pricing/pricing-cards";

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

type DemoEvent = {
  label: string;
  time: string;
};

type DemoStat = {
  title: string;
  value: string;
};

type SummaryStat = {
  label: string;
  value: string;
};

type QuickStat = {
  value: string;
  label: string;
};

type FeatureCard = {
  title: string;
  copy: string;
};

type PricingPlan = {
  name: string;
  planId: string;
  price: string;
  suffix?: string;
  desc: string;
  perks: string[];
  highlight?: boolean;
};

type StepItem = {
  title: string;
  description: string;
};

type FaqItem = {
  q: string;
  a: string;
};

const SITE_SECTION_OFFSET = -112;

export default async function Home() {
  const t = await getTranslations("home");
  const heroBullets = t.raw("hero.bullets") as string[];
  const demoEvents = t.raw("demo.events") as DemoEvent[];
  const demoStats = t.raw("demo.stats") as DemoStat[];
  const quickStats = t.raw("quickStats") as QuickStat[];
  const featureCards = t.raw("features.cards") as FeatureCard[];
  const steps = t.raw("steps.items") as StepItem[];
  const days = t.raw("steps.days") as string[];
  const summaryStats = t.raw("steps.summaryStats") as SummaryStat[];
  const pricingPlans = t.raw("pricing.plans") as PricingPlan[];
  const faqItems = t.raw("faq.items") as FaqItem[];

  const barValues = [84, 72, 91, 65, 78];
  const eventTones = [
    "bg-brand",
    "bg-brand-3",
    "bg-brand-2",
    "bg-ink",
  ];

  return (
    <main className={`${body.className} w-full bg-paper text-ink`}>
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute -top-28 right-[-6rem] h-[320px] w-[320px] sm:h-[420px] sm:w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.35),transparent_60%)] blur-2xl will-change-transform motion-safe:animate-[float_10s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-10rem] h-[320px] w-[320px] sm:h-[520px] sm:w-[520px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.3),transparent_60%)] blur-2xl will-change-transform motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.08)_1px,transparent_0)] bg-[length:18px_18px] opacity-30" />

        <section className="relative mx-auto flex w-full maxW flex-col gap-12 px-6 pb-16 pt-32 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative z-10 flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line-strong bg-white/70 px-4 py-1 text-xs uppercase text-ink-muted motion-safe:opacity-0 motion-safe:animate-[fade-up_0.8s_ease-out_forwards]">
              {t("hero.badge")}
            </span>
            <h1
              className={`${display.className} text-4xl font-semibold leading-tight text-ink motion-safe:opacity-0 motion-safe:animate-[fade-up_0.9s_ease-out_forwards] sm:text-5xl lg:text-6xl`}
              style={{ animationDelay: "120ms", whiteSpace: "pre-line" }}
            >
              {t("hero.title")}
              <span className="block text-brand-2">
                {t("hero.titleAccent")}
              </span>
            </h1>
            <p
              className="max-w-xl text-base text-ink-muted motion-safe:opacity-0 motion-safe:animate-[fade-up_1s_ease-out_forwards] sm:text-lg"
              style={{ animationDelay: "220ms" }}
            >
              {t("hero.subtitle")}
            </p>
            <div
              className="flex flex-wrap items-center gap-4 motion-safe:opacity-0 motion-safe:animate-[fade-up_1s_ease-out_forwards]"
              style={{ animationDelay: "320ms" }}
            >
              <ScrollSectionButton
                sectionId="pricing"
                offsetY={SITE_SECTION_OFFSET}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_44px_-22px_rgba(249,115,22,0.95)]"
              >
                {t("hero.ctaPrimary")}
              </ScrollSectionButton>
              <ScrollSectionButton
                sectionId="home-features"
                offsetY={SITE_SECTION_OFFSET}
                className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:translate-y-[-1px] hover:bg-white"
              >
                {t("hero.ctaSecondary")}
              </ScrollSectionButton>
            </div>
            <ul className="mt-2 grid gap-3 text-sm text-ink-muted sm:grid-cols-3">
              {heroBullets.map((item, index) => (
                <li
                  key={item}
                  className="flex items-center gap-2 motion-safe:opacity-0 motion-safe:animate-[fade-up_0.9s_ease-out_forwards]"
                  style={{ animationDelay: `${420 + index * 80}ms` }}
                >
                  <span className="h-2 w-2 rounded-full bg-brand-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            id="demo"
            className="relative z-10 rounded-3xl border border-line bg-panel p-6 shadow-[0_32px_70px_-50px_rgba(15,118,110,0.6)] motion-safe:opacity-0 motion-safe:animate-[fade-up_1s_ease-out_forwards]"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-ink-muted">
                  {t("demo.eyebrow")}
                </p>
                <p className="text-2xl font-semibold text-ink">
                  {t("demo.hours")}
                </p>
              </div>
              <span className="rounded-full bg-brand-2/10 px-3 py-1 text-xs font-semibold text-brand-2">
                {t("demo.status")}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {demoEvents.map((event, index) => (
                <div
                  key={event.label}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        eventTones[index] ?? eventTones[0]
                      }`}
                    />
                    <span className="font-medium text-ink">
                      {event.label}
                    </span>
                  </div>
                  <span className="text-ink-muted">{event.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {demoStats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-line bg-white/70 px-4 py-3"
                >
                  <p className="text-xs uppercase text-ink-muted">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-10">
          <div className="grid gap-4 text-center sm:grid-cols-3">
            {quickStats.map((stat) => (
              <div
                key={stat.value}
                className="rounded-2xl border border-line bg-white/70 px-5 py-6"
              >
                <p className="text-3xl font-semibold text-ink">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="home-features"
          className="mx-auto w-full maxW scroll-mt-28 px-6 py-16"
        >
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase text-ink-muted">
              {t("features.eyebrow")}
            </p>
            <h2
              className={`${display.className} text-3xl font-semibold text-ink sm:text-4xl`}
            >
              {t("features.title")}
            </h2>
            <p className="max-w-2xl text-ink-muted">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-line bg-white/70 p-6 shadow-[0_22px_50px_-40px_rgba(29,27,22,0.25)]"
              >
                <h3 className="text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  {feature.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs uppercase text-ink-muted">
                {t("steps.eyebrow")}
              </p>
              <h2
                className={`${display.className} mt-3 text-3xl font-semibold text-ink sm:text-4xl`}
              >
                {t("steps.title")}
              </h2>
              <p className="mt-3 text-ink-muted">
                {t("steps.subtitle")}
              </p>
              <div className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-line bg-white/70 px-4 py-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-2/10 text-sm font-semibold text-brand-2">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{step.title}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6 shadow-[0_28px_60px_-48px_rgba(15,118,110,0.5)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  {t("steps.summaryTitle")}
                </p>
                <span className="text-xs text-ink-muted">
                  {t("steps.summaryRange")}
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {days.map((day, index) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-10 text-xs text-ink-muted">
                      {day}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-ink-soft">
                      <div
                        className="h-2 rounded-full bg-brand"
                        style={{ width: `${barValues[index] ?? 60}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-muted">
                      {Math.round((barValues[index] ?? 60) / 10)}h
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {summaryStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-line bg-panel px-4 py-3"
                  >
                    <p className="text-xs uppercase text-ink-muted">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full maxW px-6 py-16">
          <p className="mb-6 text-center text-sm font-medium text-ink-muted">
            {t("pricing.socialProof")}
          </p>
          <div className="flex flex-col gap-4 text-center">
            <p className="text-xs uppercase text-ink-muted">
              {t("pricing.eyebrow")}
            </p>
            <h2
              className={`${display.className} text-3xl font-semibold text-ink sm:text-4xl`}
            >
              {t("pricing.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-ink-muted">
              {t("pricing.subtitle")}
            </p>
          </div>
          <div className="mt-10">
            <PricingCards
              plans={pricingPlans}
              userPlan={null}
              ctaLabelTemplate={t("pricing.cta", { plan: "{plan}" })}
              ctaCurrentLabel=""
              ctaManageLabel=""
              toggleMonthly={t("pricing.billingToggle.monthly")}
              toggleYearly={t("pricing.billingToggle.yearly")}
              toggleBadge={t("pricing.billingToggle.badge")}
              toggleHint={t("pricing.billingToggle.yearlyHint")}
              suffixMonthly={t("pricing.billingToggle.suffixMonthly")}
              suffixYearly={t("pricing.billingToggle.suffixYearly")}
              monthlyHint={t("pricing.billingToggle.monthlyHint")}
              yearlyEquivalent={t("pricing.billingToggle.yearlyEquivalent")}
            />
          </div>
        </section>

        <section id="faq" className="mx-auto w-full maxW px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-xs uppercase text-ink-muted">
                {t("faq.eyebrow")}
              </p>
              <h2
                className={`${display.className} mt-3 text-3xl font-semibold text-ink sm:text-4xl`}
              >
                {t("faq.title")}
              </h2>
              <p className="mt-3 max-w-xl text-ink-muted">
                {t("faq.subtitle")}
              </p>
            </div>
            <div className="space-y-4">
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
              <ScrollSectionButton
                sectionId="demo"
                offsetY={SITE_SECTION_OFFSET}
                className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {t("closing.ctaSecondary")}
              </ScrollSectionButton>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
