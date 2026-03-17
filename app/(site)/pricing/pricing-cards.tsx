"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ctaCurrentLabel: string;
  ctaManageLabel: string;
  toggleMonthly: string;
  toggleYearly: string;
  toggleBadge: string;
  toggleHint: string;
  suffixMonthly: string;
  suffixYearly: string;
  monthlyHint: string;
  yearlyEquivalent: string;
};

export function PricingCards({
  plans,
  userPlan,
  ctaLabelTemplate,
  ctaCurrentLabel,
  ctaManageLabel,
  toggleMonthly,
  toggleYearly,
  toggleBadge,
  toggleHint,
  suffixMonthly,
  suffixYearly,
  monthlyHint,
  yearlyEquivalent,
}: PricingCardsProps) {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const isYearly = billing === "yearly";

  return (
    <>
      {/* Billing toggle */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="relative flex items-center overflow-hidden rounded-full border border-line bg-white/70 p-1">
          <button
            onClick={() => setBilling(isYearly ? "monthly" : "yearly")}
            className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
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
            onClick={() => setBilling(isYearly ? "monthly" : "yearly")}
            className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
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
        <div className="flex flex-col items-center gap-1 text-sm text-ink-muted lg:flex-row lg:gap-2">
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {toggleBadge}
          </span>
          <span className="text-center">{toggleHint}</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const planDef = PLANS.find((p) => p.id === plan.planId);
          const monthlyPrice = planDef?.priceAmount ?? 0;
          const yearlyPrice = planDef?.yearlyPriceAmount ?? 0;
          const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
          const isPaid = monthlyPrice > 0;
          const suffix = isPaid
            ? isYearly ? suffixYearly : suffixMonthly
            : undefined;

          return (
            <div
              key={plan.name}
              className={`relative flex min-h-[600px] flex-col rounded-3xl border p-6 ${
                plan.highlight
                  ? "border-brand bg-white shadow-[0_26px_70px_-45px_rgba(249,115,22,0.55)] order-first lg:order-none"
                  : "border-line bg-white/70"
              }`}
            >
              {/* "2 months free" badge on paid cards when yearly */}
              <AnimatePresence>
                {isYearly && isPaid && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute -top-3 right-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-[0_4px_12px_-2px_rgba(249,115,22,0.5)]"
                  >
                    {toggleBadge}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs uppercase text-ink-muted">
                {plan.name}
              </p>

              {/* Price with animation */}
              <div className="mt-3 h-10 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isPaid ? `${plan.planId}-${billing}` : plan.planId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="text-3xl font-semibold text-ink"
                  >
                    {displayPrice === 0 ? "0" : displayPrice} CHF
                    {suffix && (
                      <span className="text-sm font-normal text-ink-muted">
                        {suffix}
                      </span>
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Monthly equivalent hint — min height to avoid layout shift */}
              <div className="mt-1 min-h-4">
                {isPaid && (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={billing}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-medium text-brand"
                    >
                      {isYearly
                        ? yearlyEquivalent.replace("__price__", (yearlyPrice / 12).toFixed(2))
                        : monthlyHint.replace("__price__", String(yearlyPrice))}
                    </motion.p>
                  </AnimatePresence>
                )}
              </div>

              <p className="mt-2 text-sm text-ink-muted">{plan.desc}</p>

              <div className="mt-5 space-y-2 text-sm">
                {plan.perks.map((perk) => {
                  const included = perk.startsWith("✓");
                  const label = perk.replace(/^[✓✗]\s*/, "");
                  return (
                    <div
                      key={perk}
                      className={`flex items-center gap-2 ${
                        included ? "text-ink-muted" : "text-ink-muted/40"
                      }`}
                    >
                      {included ? (
                        <svg className="h-4 w-4 shrink-0 text-brand-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0 text-ink-muted/30" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={!included ? "line-through" : ""}>{label}</span>
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
                ctaLabel={ctaLabelTemplate.replace("{plan}", plan.name)}
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
