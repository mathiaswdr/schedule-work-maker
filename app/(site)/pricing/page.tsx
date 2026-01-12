import Link from "next/link";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { getTranslations } from "next-intl/server";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type PricingPlan = {
  name: string;
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

export default async function PricingPage() {
  const t = await getTranslations("pricingPage");
  const plans = t.raw("plans") as PricingPlan[];
  const includedItems = t.raw("included.items") as string[];
  const exampleStats = t.raw("example.stats") as StatItem[];
  const faqItems = t.raw("faq.items") as FaqItem[];

  return (
    <main className={`${body.className} w-full bg-paper text-ink`}>
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.35),transparent_60%)] blur-2xl motion-safe:animate-[float_10s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.3),transparent_60%)] blur-3xl motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.08)_1px,transparent_0)] bg-[length:18px_18px] opacity-30" />

        <section className="mx-auto w-full maxW px-6 pb-10 pt-32 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
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
            <Link
              href="/#demo"
              className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 pb-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl border p-6 ${
                  plan.highlight
                    ? "border-brand bg-white shadow-[0_26px_70px_-45px_rgba(249,115,22,0.55)]"
                    : "border-line bg-white/70"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {plan.name}
                </p>
                <p className="mt-3 text-3xl font-semibold text-ink">
                  {plan.price}
                  {plan.suffix ? (
                    <span className="text-sm font-normal text-ink-muted">
                      {plan.suffix}
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {plan.desc}
                </p>
                <div className="mt-5 space-y-2 text-sm text-ink-muted">
                  {plan.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-2" />
                      {perk}
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/login"
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-brand text-white hover:translate-y-[-1px]"
                      : "border border-line-strong bg-white/70 text-ink hover:bg-white"
                  }`}
                >
                  {t("cta", { plan: plan.name })}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
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
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
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
