"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, Clock3, FileText, ShieldCheck } from "lucide-react";

import { localizedPath } from "@/lib/i18n-routing";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup";

type AuthCardProps = {
  children: React.ReactNode;
  mode: AuthMode;
  alternateHref: string;
};

const modeLinks: Array<{ href: string; mode: AuthMode; labelKey: string }> = [
  { href: "/auth/login", mode: "login", labelKey: "loginTab" },
  { href: "/auth/signup", mode: "signup", labelKey: "signupTab" },
];

const highlights = [
  { icon: Clock3, labelKey: "highlightTime" },
  { icon: FileText, labelKey: "highlightInvoices" },
  { icon: ShieldCheck, labelKey: "highlightTrial" },
] as const;

export const AuthCard = ({ children, mode, alternateHref }: AuthCardProps) => {
  const locale = useLocale();
  const t = useTranslations("auth");

  return (
    <section className="min-h-screen bg-paper px-4 pb-12 pt-28 text-ink sm:px-6 lg:pb-16 lg:pt-32">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
            {t(mode === "signup" ? "signupHeroTitle" : "loginHeroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
            {t(mode === "signup" ? "signupHeroSubtitle" : "loginHeroSubtitle")}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, labelKey }) => (
              <div
                key={labelKey}
                className="border border-line bg-white px-4 py-4 shadow-[0_16px_45px_-38px_rgba(29,27,22,0.7)]"
              >
                <Icon className="h-5 w-5 text-brand" />
                <p className="mt-3 text-sm font-medium leading-5 text-ink">
                  {t(labelKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-ink-muted">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-2" />
            <span>{t("securityNote")}</span>
          </div>
        </div>

        <div className="border border-line bg-white p-4 shadow-[0_24px_80px_-50px_rgba(29,27,22,0.8)] sm:p-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-panel p-1">
            {modeLinks.map((item) => {
              const isActive = item.mode === mode;

              return (
                <Link
                  key={item.mode}
                  href={localizedPath(item.href, locale)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                    isActive
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-muted hover:bg-white/70 hover:text-ink",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>

          <div className="mt-7">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              {t(mode === "signup" ? "signupKicker" : "loginKicker")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-ink sm:text-3xl">
              {t(mode === "signup" ? "signupTitle" : "loginTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              {t(mode === "signup" ? "signupSubtitle" : "loginSubtitle")}
            </p>
          </div>

          <div className="mt-7">{children}</div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {t(mode === "signup" ? "signupSwitchText" : "loginSwitchText")}{" "}
            <Link
              href={localizedPath(alternateHref, locale)}
              className="font-semibold text-brand hover:text-brand/80"
            >
              {t(mode === "signup" ? "signupSwitchLink" : "loginSwitchLink")}
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
