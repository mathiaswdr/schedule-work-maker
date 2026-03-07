import Link from "next/link";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { getTranslations } from "next-intl/server";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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

export default async function AboutPage() {
  const t = await getTranslations("aboutPage");
  const impactStats = t.raw("impact.stats") as StatItem[];
  const values = t.raw("mission.values") as ValueItem[];
  const buildSteps = t.raw("build.steps") as StepItem[];
  const timeline = t.raw("story.timeline") as string[];

  return (
    <main className={`${body.className} w-full bg-paper text-ink`}>
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-[-5rem] h-[320px] w-[320px] sm:h-[420px] sm:w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.3),transparent_60%)] blur-2xl will-change-transform motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-9rem] h-[320px] w-[320px] sm:h-[460px] sm:w-[460px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(15,118,110,0.3),transparent_60%)] blur-2xl will-change-transform motion-safe:animate-[float_10s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.08)_1px,transparent_0)] bg-[length:18px_18px] opacity-30" />

        <section className="mx-auto w-full maxW px-6 pb-12 pt-32">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {t("hero.eyebrow")}
              </p>
              <h1
                className={`${display.className} mt-4 text-4xl font-semibold text-ink sm:text-5xl`}
              >
                {t("hero.title")}
              </h1>
              <p className="mt-4 text-base text-ink-muted sm:text-lg">
                {t("hero.subtitle")}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/auth/login"
                  className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px]"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full border border-line-strong bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white/80 p-6 shadow-[0_28px_60px_-48px_rgba(15,118,110,0.5)]">
              <p className="text-sm font-semibold text-ink">
                {t("impact.title")}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {impactStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-line bg-panel px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-10">
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              {t("mission.eyebrow")}
            </p>
            <h2
              className={`${display.className} text-3xl font-semibold text-ink`}
            >
              {t("mission.title")}
            </h2>
            <p className="max-w-2xl text-ink-muted">
              {t("mission.subtitle")}
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-line bg-white/70 p-6"
              >
                <h3 className="text-lg font-semibold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  {value.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="rounded-3xl border border-line bg-white/80 p-6 shadow-[0_28px_60px_-48px_rgba(249,115,22,0.4)]">
              <p className="text-sm font-semibold text-ink">
                {t("build.title")}
              </p>
              <div className="mt-5 space-y-4">
                {buildSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-line bg-panel px-4 py-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-2/10 text-sm font-semibold text-brand-2">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {step.title}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {step.copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {t("story.eyebrow")}
              </p>
              <h2
                className={`${display.className} mt-3 text-3xl font-semibold text-ink`}
              >
                {t("story.title")}
              </h2>
              <p className="mt-3 text-ink-muted">
                {t("story.subtitle")}
              </p>
              <div className="mt-6 space-y-3">
                {timeline.map((line) => (
                  <div
                    key={line}
                    className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-ink-muted"
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
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
                href="/pricing"
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
