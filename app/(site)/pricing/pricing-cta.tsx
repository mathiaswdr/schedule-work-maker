"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { canUpgrade, type PlanId, type BillingPeriod } from "@/lib/plans";

type PricingCtaProps = {
  planId: PlanId;
  planName: string;
  highlight: boolean;
  userPlan: string | null;
  billing: BillingPeriod;
  ctaLabel: string;
  ctaCurrentLabel: string;
  ctaManageLabel: string;
};

export function PricingCta({
  planId,
  planName,
  highlight,
  userPlan,
  billing,
  ctaLabel,
  ctaCurrentLabel,
  ctaManageLabel,
}: PricingCtaProps) {
  const router = useRouter();

  // Not logged in → link to login
  if (!userPlan) {
    return (
      <Link
        href="/auth/login"
        className={`mt-auto flex w-full items-center justify-center text-center rounded-full px-4 py-3 text-sm leading-tight font-semibold transition ${
          highlight
            ? "bg-brand text-white hover:translate-y-[-1px]"
            : "border border-line-strong bg-white/70 text-ink hover:bg-white"
        }`}
      >
        {ctaLabel}
      </Link>
    );
  }

  const isCurrent = userPlan === planId;
  const isUpgrade = canUpgrade(userPlan, planId);

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
        className="mt-auto flex w-full items-center justify-center text-center rounded-full border border-line-strong bg-white/70 px-4 py-3 text-sm leading-tight font-semibold text-ink transition hover:bg-white"
      >
        {ctaManageLabel}
      </button>
    );
  }

  // Current plan (free) or lower → disabled
  if (isCurrent || !isUpgrade) {
    return (
      <div className="mt-auto flex w-full items-center justify-center text-center rounded-full border border-line bg-panel px-4 py-3 text-sm leading-tight font-medium text-ink-muted">
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
            body: JSON.stringify({ plan: planId, billing }),
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
          else toast.error(data.message);
        } catch {
          toast.error("An error occurred");
        }
      }}
      className={`mt-auto flex w-full items-center justify-center text-center rounded-full px-4 py-3 text-sm leading-tight font-semibold transition ${
        highlight
          ? "bg-brand text-white hover:translate-y-[-1px]"
          : "border border-line-strong bg-white/70 text-ink hover:bg-white"
      }`}
    >
      {ctaLabel}
    </button>
  );
}
