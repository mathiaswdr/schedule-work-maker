import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ListChecks,
  Target,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { MagicCard } from "@/components/magicui/magic-card";
import { Button } from "@/components/ui/button";
import {
  buildMarketingMetadata,
  localizedAbsoluteUrl,
  serializeJsonLd,
} from "@/lib/seo";
import { buildSignupCheckoutHref } from "@/lib/checkout-intent";
import { localizedPath } from "@/lib/i18n-routing";

const sectionLabel =
  "text-xs font-semibold uppercase tracking-[0.18em] text-brand";
const sectionTitle =
  "mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl";
const sectionIntro = "mt-4 max-w-2xl text-base leading-7 text-ink-muted";

type StatItem = {
  label: string;
  value: string;
};

type ValueItem = {
  title: string;
  copy: string;
};

type StepItem = {
  title: string;
  copy: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isEnglish = locale === "en";

  return buildMarketingMetadata({
    title: isEnglish
      ? "About Kronoma | Time tracking software for freelancers"
      : "A propos de Kronoma | Logiciel de suivi du temps pour freelances",
    description: isEnglish
      ? "Discover Kronoma, the freelancer time tracking software designed to make hours visible, simplify international invoicing, and move work out of spreadsheets."
      : "Decouvrez Kronoma, le logiciel de suivi du temps pour freelances concu pour rendre les heures visibles, simplifier la facturation internationale et sortir des tableurs.",
    path: "/about",
    locale,
  });
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("aboutPage");
  const impactStats = t.raw("impact.stats") as StatItem[];
  const values = t.raw("mission.values") as ValueItem[];
  const buildSteps = t.raw("build.steps") as StepItem[];
  const timeline = t.raw("story.timeline") as string[];
  const canonicalUrl = localizedAbsoluteUrl("/about", locale);
  const aboutJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Kronoma",
      url: canonicalUrl,
      description: t("hero.subtitle"),
    },
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "A propos de Kronoma",
      url: canonicalUrl,
      inLanguage: locale,
      description: t("story.subtitle"),
    },
  ];

  return (
    <main className="w-full bg-white text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutJsonLd) }}
      />
      <div className="relative overflow-hidden">
        <section className="mx-auto grid w-full maxW gap-10 px-6 pb-14 pt-28 sm:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-20 lg:pt-36">
          <div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
              <AnimatedGradientText>{t("hero.title")}</AnimatedGradientText>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(249,115,22,0.95)] hover:bg-brand/90"
              >
                <Link href={localizedPath(buildSignupCheckoutHref(), locale)}>
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-line-strong bg-white/70 px-6 text-sm font-semibold text-ink hover:bg-white"
              >
                <Link href={localizedPath("/pricing", locale)}>
                  {t("hero.ctaSecondary")}
                </Link>
              </Button>
            </div>
          </div>

          <MagicCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={sectionLabel}>{t("impact.title")}</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
                  {t("mission.subtitle")}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {impactStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-white px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-ink px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Kronoma</p>
                  <p className="text-xs text-white/60">
                    {t("closing.subtitle")}
                  </p>
                </div>
              </div>
            </div>
          </MagicCard>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="max-w-3xl">
            <p className={sectionLabel}>{t("mission.eyebrow")}</p>
            <h2 className={sectionTitle}>{t("mission.title")}</h2>
            <p className={sectionIntro}>{t("mission.subtitle")}</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <MagicCard key={value.title} className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-tight text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {value.copy}
                </p>
              </MagicCard>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="grid gap-10 rounded-[28px] border border-line bg-white p-6 shadow-[0_28px_80px_-66px_rgba(29,27,22,0.42)] lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
            <div>
              <p className={sectionLabel}>{t("story.eyebrow")}</p>
              <h2 className={sectionTitle}>{t("story.title")}</h2>
              <p className={sectionIntro}>{t("story.subtitle")}</p>
            </div>
            <div className="grid gap-4">
              {timeline.map((line, index) => (
                <MagicCard key={line} className="p-5">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                      0{index + 1}
                    </div>
                    <p className="self-center text-sm leading-6 text-ink-muted">
                      {line}
                    </p>
                  </div>
                </MagicCard>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="grid gap-8 overflow-hidden rounded-[28px] border border-line bg-ink p-6 text-white shadow-[0_28px_90px_-62px_rgba(29,27,22,0.85)] lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                {t("build.title")}
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                {t("mission.title")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                {t("mission.subtitle")}
              </p>
            </div>
            <MagicCard className="bg-white/95 p-4 text-ink">
              <div className="rounded-2xl border border-line bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    {t("build.title")}
                  </p>
                </div>
                <div className="mt-5 grid gap-3">
                  {buildSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="grid gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:grid-cols-[2.5rem_1fr]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-ink-muted">
                          {step.copy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </MagicCard>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 pb-24 pt-16">
          <div className="overflow-hidden rounded-[32px] border border-line bg-ink px-6 py-12 text-center text-white shadow-[0_30px_100px_-65px_rgba(29,27,22,0.9)] sm:px-10 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              {t("closing.eyebrow")}
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
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
                <Link href={localizedPath("/pricing", locale)}>
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
