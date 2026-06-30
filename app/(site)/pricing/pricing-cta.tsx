"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  canUpgrade,
  normalizePlanId,
  type PlanId,
  type BillingPeriod,
} from "@/lib/plans";
import type { PricingCurrency } from "@/lib/pricing-currency";
import { buildSignupCheckoutHref } from "@/lib/checkout-intent";
import { localizedPath } from "@/lib/i18n-routing";

type PricingCtaProps = {
  planId: PlanId;
  planName: string;
  highlight: boolean;
  userPlan: string | null;
  billing: BillingPeriod;
  currency: PricingCurrency;
  ctaLabel: string;
  ctaCurrentLabel: string;
  ctaManageLabel: string;
};

export function PricingCta({
  planId,
  highlight,
  userPlan,
  billing,
  currency,
  ctaLabel,
  ctaCurrentLabel,
  ctaManageLabel,
}: PricingCtaProps) {
  const locale = useLocale();

  // Not logged in → link to login
  if (!userPlan) {
    return (
      <Link
        href={
          planId === "FREE"
            ? localizedPath("/auth/login?callbackUrl=%2Fdashboard", locale)
            : localizedPath(buildSignupCheckoutHref(planId, billing, currency), locale)
        }
        className={`flex min-h-11 w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-semibold leading-tight transition ${
          highlight
            ? "bg-brand text-white shadow-[0_18px_44px_-24px_rgba(249,115,22,0.95)] hover:bg-brand/90"
            : "border border-line-strong bg-white text-ink hover:bg-neutral-50"
        }`}
      >
        {ctaLabel}
      </Link>
    );
  }

  const currentPlan = normalizePlanId(userPlan);
  const isCurrent = currentPlan === planId;
  const isUpgrade = canUpgrade(currentPlan, planId);

  // Current plan (paid) → manage billing
  if (isCurrent && planId !== "FREE") {
    return (
      <button
        onClick={async () => {
          try {
            const res = await fetch("/api/payment-dashboard", { method: "POST" });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else toast.error(data.message);
          } catch {
            toast.error("An error occurred");
          }
        }}
        className="flex min-h-11 w-full items-center justify-center rounded-full border border-line-strong bg-white px-4 py-3 text-center text-sm font-semibold leading-tight text-ink transition hover:bg-neutral-50"
      >
        {ctaManageLabel}
      </button>
    );
  }

  // Current plan (free) or lower → disabled
  if (isCurrent || !isUpgrade) {
    return (
      <div className="flex min-h-11 w-full items-center justify-center rounded-full border border-line bg-neutral-50 px-4 py-3 text-center text-sm font-medium leading-tight text-ink-muted">
        {ctaCurrentLabel}
      </div>
    );
  }

  // Can upgrade → checkout
  return (
    <button
      onClick={async () => {
        try {
          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: planId, billing, currency }),
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
          else toast.error(data.message);
        } catch {
          toast.error("An error occurred");
        }
      }}
      className={`flex min-h-11 w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-semibold leading-tight transition ${
        highlight
          ? "bg-brand text-white shadow-[0_18px_44px_-24px_rgba(249,115,22,0.95)] hover:bg-brand/90"
          : "border border-line-strong bg-white text-ink hover:bg-neutral-50"
      }`}
    >
      {ctaLabel}
    </button>
  );
}
