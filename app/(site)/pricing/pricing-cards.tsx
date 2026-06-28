"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { type PlanId, type BillingPeriod, PLANS } from "@/lib/plans";
import { EASE } from "@/lib/motion-variants";
import { PricingCta } from "./pricing-cta";

type PricingPlan = {
  name: string;
  planId: string;
  price: string;
  suffix?: string;
  desc: string;
  perks: string[];
  highlight?: boolean;
};

type PricingCardsProps = {
  plans: PricingPlan[];
  userPlan: string | null;
  ctaLabelTemplate: string;
  ctaFreeLabel: string;
  ctaTrialLabel: string;
  ctaLifetimeLabel: string;
  ctaCurrentLabel: string;
  ctaManageLabel: string;
  freeNote: string;
  trialNote: string;
  lifetimeNote: string;
  toggleMonthly: string;
  toggleYearly: string;
  toggleBadge: string;
  toggleHint: string;
  suffixMonthly: string;
  suffixYearly: string;
  monthlyHint: string;
  yearlyEquivalent: string;
  gridMaxWidthClassName?: string;
};

export function PricingCards({
  plans,
  userPlan,
  ctaLabelTemplate,
  ctaFreeLabel,
  ctaTrialLabel,
  ctaLifetimeLabel,
  ctaCurrentLabel,
  ctaManageLabel,
  freeNote,
  trialNote,
  lifetimeNote,
  toggleMonthly,
  toggleYearly,
  toggleBadge,
  toggleHint,
  suffixMonthly,
  suffixYearly,
  monthlyHint,
  yearlyEquivalent,
  gridMaxWidthClassName = "max-w-none",
}: PricingCardsProps) {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const isYearly = billing === "yearly";
  const gridClassName = plans.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <>
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="relative flex items-center overflow-hidden rounded-full border border-line bg-white p-1 shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]">
          <button
            type="button"
            aria-pressed={!isYearly}
            onClick={() => setBilling("monthly")}
            className={`relative z-10 min-h-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              !isYearly ? "text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            {!isYearly && (
              <motion.div
                layoutId="billing-toggle"
                className="absolute inset-0 rounded-full bg-brand shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{toggleMonthly}</span>
          </button>
          <button
            type="button"
            aria-pressed={isYearly}
            onClick={() => setBilling("yearly")}
            className={`relative z-10 min-h-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              isYearly ? "text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            {isYearly && (
              <motion.div
                layoutId="billing-toggle"
                className="absolute inset-0 rounded-full bg-brand shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{toggleYearly}</span>
          </button>
        </div>
        <div className="flex flex-col items-center gap-1 text-sm leading-6 text-ink-muted lg:flex-row lg:gap-2">
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {toggleBadge}
          </span>
          <span className="text-center">{toggleHint}</span>
        </div>
      </div>

      <div className={`mx-auto grid ${gridMaxWidthClassName} gap-5 ${gridClassName}`}>
        {plans.map((plan) => {
          const planDef = PLANS.find((p) => p.id === plan.planId);
          const isLifetime = planDef?.billingType === "lifetime";
          const monthlyPrice = planDef?.priceAmount ?? 0;
          const yearlyPrice = planDef?.yearlyPriceAmount ?? 0;
          const compareAtPrice = isLifetime ? planDef?.compareAtPriceAmount : undefined;
          const displayPrice = isLifetime ? monthlyPrice : isYearly ? yearlyPrice : monthlyPrice;
          const isPaid = monthlyPrice > 0;
          const isSubscription = isPaid && !isLifetime;
          const ctaLabel = isLifetime
            ? ctaLifetimeLabel.replace("{plan}", plan.name)
            : isPaid
            ? ctaTrialLabel.replace("{plan}", plan.name)
            : ctaFreeLabel;
          const suffix = isSubscription
            ? isYearly ? suffixYearly : suffixMonthly
            : undefined;

          return (
            <div
              key={plan.name}
              className={`relative flex min-h-[560px] flex-col rounded-2xl border bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-line-strong ${
                plan.highlight
                  ? "order-first border-line shadow-[0_26px_80px_-50px_rgba(249,115,22,0.65)] ring-1 ring-brand/30 lg:order-none"
                  : "border-line shadow-[0_20px_60px_-52px_rgba(29,27,22,0.55)]"
              }`}
            >
              <AnimatePresence>
                {isYearly && isSubscription && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute -top-3 right-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-[0_14px_32px_-18px_rgba(249,115,22,0.95)]"
                  >
                    {toggleBadge}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xl font-semibold text-ink">{plan.name}</p>
                {plan.highlight ? (
                  <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    Premium
                  </span>
                ) : null}
              </div>

              <div className="mt-5 h-12 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isSubscription ? `${plan.planId}-${billing}` : plan.planId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="flex items-baseline gap-2 whitespace-nowrap text-4xl font-semibold text-ink"
                  >
                    <span>{displayPrice === 0 ? "0" : displayPrice} CHF</span>
                    {suffix && (
                      <span className="text-sm font-normal text-ink-muted">
                        {suffix}
                      </span>
                    )}
                    {compareAtPrice && (
                      <span className="text-sm font-semibold text-ink-muted line-through decoration-brand/70 decoration-2">
                        {compareAtPrice} CHF
                      </span>
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="mt-1 min-h-5">
                {isSubscription ? (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={billing}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-medium leading-5 text-brand"
                    >
                      {isYearly
                        ? yearlyEquivalent.replace("__price__", (yearlyPrice / 12).toFixed(2))
                        : monthlyHint.replace("__price__", String(yearlyPrice))}
                    </motion.p>
                  </AnimatePresence>
                ) : isLifetime ? (
                  <p className="text-xs font-medium leading-5 text-brand">{lifetimeNote}</p>
                ) : null}
              </div>

              <p className="mt-3 min-h-[48px] text-sm leading-6 text-ink-muted">{plan.desc}</p>
              <p
                className={`mt-4 rounded-2xl px-3 py-2 text-xs font-semibold leading-5 ${
                  isPaid
                    ? "bg-brand/10 text-brand"
                    : "bg-ink-soft text-ink-muted"
                }`}
              >
                {isLifetime ? lifetimeNote : isPaid ? trialNote : freeNote}
              </p>

              <div className="mt-6 space-y-3 text-sm">
                {plan.perks.map((perk) => {
                  const included = perk.startsWith("✓");
                  const label = perk.replace(/^[✓✗]\s*/, "");
                  return (
                    <div
                      key={perk}
                      className={`flex items-start gap-2 ${
                        included ? "text-ink-muted" : "text-ink-muted/40"
                      }`}
                    >
                      {included ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted/35" />
                      )}
                      <span className={`leading-6 ${!included ? "line-through" : ""}`}>{label}</span>
                    </div>
                  );
                })}
              </div>

              <PricingCta
                planId={plan.planId as PlanId}
                planName={plan.name}
                highlight={!!plan.highlight}
                userPlan={userPlan}
                billing={billing}
                ctaLabel={ctaLabel || ctaLabelTemplate.replace("{plan}", plan.name)}
                ctaCurrentLabel={ctaCurrentLabel}
                ctaManageLabel={ctaManageLabel}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
