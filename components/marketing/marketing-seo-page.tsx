import Link from "next/link";
import { DM_Serif_Display, Space_Grotesk } from "next/font/google";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  LayoutDashboard,
} from "lucide-react";

import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { MagicCard } from "@/components/magicui/magic-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localizedPath } from "@/lib/i18n-routing";
import { localizedAbsoluteUrl, serializeJsonLd } from "@/lib/seo";
import type { MarketingPageData } from "@/lib/marketing-pages";

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

type MarketingSeoPageProps = {
  page: MarketingPageData;
  locale: string;
};

export function MarketingSeoPage({ page, locale }: MarketingSeoPageProps) {
  const isEnglish = locale === "en";
  const canonicalUrl = localizedAbsoluteUrl(page.path, locale);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      url: canonicalUrl,
      inLanguage: locale,
      description: page.description,
      dateModified: "2026-06-27",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Kronoma",
          item: localizedAbsoluteUrl("/", locale),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.heading,
          item: canonicalUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  if (page.path.startsWith("/features/")) {
    return (
      <FeatureMarketingSeoPage
        isEnglish={isEnglish}
        jsonLd={jsonLd}
        locale={locale}
        page={page}
      />
    );
  }

  const labels = {
    summary: isEnglish ? "In short" : "En bref",
    criterion: isEnglish ? "Criterion" : "Critere",
    alternative: isEnglish ? "Alternative" : "Alternative",
    faqEyebrow: isEnglish ? "FAQ" : "FAQ",
    faqTitle: isEnglish ? "Quick answers" : "Reponses rapides",
    faqIntro: isEnglish
      ? "Short answers to understand when to use this part of Kronoma."
      : "Des reponses courtes pour comprendre quand utiliser cette partie de Kronoma.",
    closingEyebrow: "Kronoma",
    closingTitle: isEnglish
      ? "Track, review, invoice."
      : "Suivez, verifiez, facturez.",
    closingBody: isEnglish
      ? "Keep a clear record of your hours and turn them into usable documents when the work is done."
      : "Gardez une trace claire de vos heures et transformez-les en documents exploitables quand la mission est terminee.",
    closingPrimary: isEnglish ? "Try Kronoma" : "Essayer Kronoma",
    closingSecondary: isEnglish ? "See pricing" : "Voir les tarifs",
  };

  return (
    <main className={`${body.className} w-full bg-paper text-ink`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute -top-28 right-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.32),transparent_60%)] blur-2xl sm:h-[420px] sm:w-[420px]" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-9rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.28),transparent_60%)] blur-2xl sm:h-[480px] sm:w-[480px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.08)_1px,transparent_0)] bg-[length:18px_18px] opacity-30" />

        <section className="relative mx-auto grid w-full maxW gap-10 px-6 pb-12 pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-xs uppercase text-ink-muted">{page.eyebrow}</p>
            <h1
              className={`${display.className} mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl`}
            >
              {page.heading}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
              {page.lead}
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href={localizedPath(page.primaryHref, locale)}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px]"
              >
                {page.primaryCta}
              </Link>
              <Link
                href={localizedPath(page.secondaryHref, locale)}
                className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {page.secondaryCta}
              </Link>
            </div>
            <p className="mt-6 text-xs font-medium uppercase text-ink-muted">
              {page.lastUpdated}
            </p>
          </div>

          <div className="relative z-10 rounded-3xl border border-line bg-white/80 p-6 shadow-[0_28px_60px_-48px_rgba(15,118,110,0.5)]">
            <p className="text-sm font-semibold text-ink">{labels.summary}</p>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              {page.summary}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {page.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-panel px-4 py-3"
                >
                  <p className="text-xs uppercase text-ink-muted">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full maxW gap-6 px-6 py-12 lg:grid-cols-2">
          {page.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-line bg-white/75 p-6"
            >
              <p className="text-xs uppercase text-ink-muted">
                {section.eyebrow}
              </p>
              <h2
                className={`${display.className} mt-3 text-3xl font-semibold text-ink`}
              >
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                {section.body}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-ink-muted">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-2" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        {page.comparison ? (
          <section className="mx-auto w-full maxW px-6 py-12">
            <div className="rounded-3xl border border-line bg-white/80 p-6">
              <h2
                className={`${display.className} text-3xl font-semibold text-ink`}
              >
                {page.comparison.title}
              </h2>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-[0.8fr_1fr_1fr] bg-panel px-4 py-3 text-xs font-semibold uppercase text-ink-muted">
                  <span>{labels.criterion}</span>
                  <span>Kronoma</span>
                  <span>{labels.alternative}</span>
                  </div>
                  {page.comparison.rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-t border-line bg-white/70 px-4 py-4 text-sm"
                    >
                      <span className="font-semibold text-ink">
                        {row.label}
                      </span>
                      <span className="text-ink-muted">{row.kronoma}</span>
                      <span className="text-ink-muted">{row.alternative}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto w-full maxW px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-xs uppercase text-ink-muted">
                {labels.faqEyebrow}
              </p>
              <h2
                className={`${display.className} mt-3 text-3xl font-semibold text-ink`}
              >
                {labels.faqTitle}
              </h2>
              <p className="mt-3 max-w-xl text-ink-muted">
                {labels.faqIntro}
              </p>
            </div>
            <div className="space-y-4">
              {page.faq.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-line bg-white/70 px-5 py-4"
                >
                  <p className="text-sm font-semibold text-ink">{item.q}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
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
              {labels.closingEyebrow}
            </p>
            <h2
              className={`${display.className} mt-4 text-3xl font-semibold text-ink sm:text-4xl`}
            >
              {labels.closingTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-muted">
              {labels.closingBody}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href={localizedPath("/auth/login", locale)}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px]"
              >
                {labels.closingPrimary}
              </Link>
              <Link
                href={localizedPath("/pricing", locale)}
                className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {labels.closingSecondary}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureMarketingSeoPage({
  isEnglish,
  jsonLd,
  locale,
  page,
}: MarketingSeoPageProps & {
  isEnglish: boolean;
  jsonLd: unknown;
}) {
  const labels = {
    summary: isEnglish ? "In short" : "En bref",
    highlights: isEnglish ? "What you get" : "Ce que vous obtenez",
    criterion: isEnglish ? "Criterion" : "Critere",
    alternative: isEnglish ? "Alternative" : "Alternative",
    faqEyebrow: "FAQ",
    faqTitle: isEnglish ? "Quick answers." : "Reponses rapides.",
    faqIntro: isEnglish
      ? "Short answers before you decide if this feature fits your workflow."
      : "Des reponses courtes avant de voir si cette fonction correspond a votre workflow.",
    closingTitle: isEnglish
      ? "Ready to manage the work more clearly?"
      : "Pret a gerer le travail plus clairement ?",
    closingBody: isEnglish
      ? "Start with the workspace, connect clients and projects, then keep the useful traces in one place."
      : "Demarrez avec l'espace de travail, reliez clients et projets, puis gardez les traces utiles au meme endroit.",
    closingPrimary: isEnglish ? "Try Kronoma" : "Essayer Kronoma",
    closingSecondary: isEnglish ? "See pricing" : "Voir les tarifs",
  };

  return (
    <main className="w-full bg-white text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <section className="relative mx-auto flex w-full maxW flex-col items-center px-6 pb-12 pt-28 text-center sm:pt-32 lg:pb-16 lg:pt-36">
        <Badge className="border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand shadow-[0_12px_36px_-30px_rgba(29,27,22,0.55)] hover:bg-white">
          {page.eyebrow}
        </Badge>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
          <AnimatedGradientText>{page.heading}</AnimatedGradientText>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
          {page.lead}
        </p>
        <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(249,115,22,0.95)] hover:bg-brand/90"
          >
            <Link href={localizedPath(page.primaryHref, locale)}>
              {page.primaryCta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-line-strong bg-white/70 px-6 text-sm font-semibold text-ink hover:bg-white"
          >
            <Link href={localizedPath(page.secondaryHref, locale)}>
              {page.secondaryCta}
            </Link>
          </Button>
        </div>

        <MagicCard className="mt-12 w-full max-w-5xl p-4 text-left sm:mt-14 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-ink p-5 text-white sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                    {labels.summary}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Kronoma
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
                {page.summary}
              </p>
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                {page.lastUpdated}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {page.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-panel px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </MagicCard>
      </section>

      <section className="mx-auto w-full maxW px-6 py-16">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {labels.highlights}
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
              {page.sections[0]?.title ?? page.heading}
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-ink-muted">
            {page.sections[0]?.body ?? page.summary}
          </p>
        </div>

        <BentoGrid className="mt-10">
          {page.sections.map((section) => (
            <BentoCard key={section.title} className="md:col-span-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <FileText className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                {section.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold leading-tight text-ink">
                {section.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                {section.body}
              </p>
              <ul className="mt-5 grid gap-3">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm leading-6 text-ink-muted"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </BentoCard>
          ))}
        </BentoGrid>
      </section>

      {page.comparison ? (
        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="overflow-hidden rounded-[28px] border border-line bg-ink p-5 text-white shadow-[0_28px_90px_-62px_rgba(29,27,22,0.85)] sm:p-6 lg:p-8">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
              {page.comparison.title}
            </h2>
            <div className="mt-7 overflow-x-auto rounded-2xl border border-white/12 bg-white/5">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-4 bg-white/8 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                  <span>{labels.criterion}</span>
                  <span>Kronoma</span>
                  <span>{labels.alternative}</span>
                </div>
                {page.comparison.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[0.8fr_1fr_1fr] gap-4 border-t border-white/10 px-4 py-4 text-sm"
                  >
                    <span className="font-semibold text-white">{row.label}</span>
                    <span className="leading-6 text-white/72">{row.kronoma}</span>
                    <span className="leading-6 text-white/55">
                      {row.alternative}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full maxW px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {labels.faqEyebrow}
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
              {labels.faqTitle}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
              {labels.faqIntro}
            </p>
          </div>
          <div className="grid gap-3">
            {page.faq.map((item) => (
              <MagicCard key={item.q} className="p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-4 w-4 shrink-0 text-brand" />
                  <div>
                    <h3 className="text-base font-semibold leading-6 text-ink">
                      {item.q}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      {item.a}
                    </p>
                  </div>
                </div>
              </MagicCard>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full maxW px-6 pb-24 pt-8">
        <div className="overflow-hidden rounded-[32px] border border-line bg-ink px-6 py-12 text-center text-white shadow-[0_30px_100px_-65px_rgba(29,27,22,0.9)] sm:px-10 lg:py-16">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            {labels.closingTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">
            {labels.closingBody}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-full bg-brand px-6 text-white hover:bg-brand/90"
            >
              <Link href={localizedPath("/auth/login", locale)}>
                {labels.closingPrimary}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={localizedPath("/pricing", locale)}>
                {labels.closingSecondary}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
