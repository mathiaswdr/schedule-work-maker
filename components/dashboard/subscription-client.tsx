"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PLANS, canUpgrade, type PlanId, type BillingPeriod } from "@/lib/plans";

type SubscriptionClientProps = {
  plan: string;
  hasStripeCustomer: boolean;
  displayClassName: string;
};

export default function SubscriptionClient({
  plan,
  hasStripeCustomer,
  displayClassName,
}: SubscriptionClientProps) {
  const t = useTranslations("dashboard");
  const shouldReduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const isYearly = billing === "yearly";

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success(t("subscriptionPage.successMessage"));
    }
  }, [searchParams, t]);

  const handleUpgrade = async (targetPlan: PlanId) => {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, billing }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        toast.error(data.message);
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/payment-dashboard", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        toast.error(data.message);
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const v = pickVariants(shouldReduceMotion);

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.22),transparent_60%)] blur-2xl will-change-transform" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.22),transparent_60%)] blur-3xl will-change-transform" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.07)_1px,transparent_0)] bg-[length:18px_18px] opacity-30 will-change-transform" />

        <motion.div
          className="relative z-10 space-y-8"
          variants={v.container}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.section variants={v.fadeUp} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              {t("eyebrow")}
            </p>
            <h1
              className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
            >
              {t("subscriptionPage.title")}
            </h1>
            <p className="max-w-xl text-sm text-ink-muted sm:text-base">
              {t("subscriptionPage.subtitle")}
            </p>
          </motion.section>

          {/* Billing toggle */}
          <motion.section variants={v.fadeUp} className="flex flex-col items-center gap-3">
            <div className="relative flex items-center overflow-hidden rounded-full border border-line bg-white/70 p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  !isYearly ? "text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                {!isYearly && (
                  <motion.div
                    layoutId="sub-billing-toggle"
                    className="absolute inset-0 rounded-full bg-brand shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t("subscriptionPage.billingToggle.monthly")}</span>
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  isYearly ? "text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                {isYearly && (
                  <motion.div
                    layoutId="sub-billing-toggle"
                    className="absolute inset-0 rounded-full bg-brand shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t("subscriptionPage.billingToggle.yearly")}</span>
              </button>
            </div>
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {t("subscriptionPage.billingToggle.badge")}
              </span>
              {t("subscriptionPage.billingToggle.yearlyHint")}
            </p>
          </motion.section>

          {/* Plan cards grid */}
          <motion.section variants={v.fadeUp}>
            <div className="grid gap-6 lg:grid-cols-3">
              {PLANS.map((planDef) => {
                const isCurrent = plan === planDef.id;
                const isUpgrade = canUpgrade(plan, planDef.id);
                const i18nKey = planDef.i18nKey as "free" | "starter" | "pro";
                const perks = t.raw(`subscriptionPage.plans.${i18nKey}.perks`) as string[];
                const monthlyPrice = planDef.priceAmount;
                const yearlyPrice = planDef.yearlyPriceAmount;
                const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
                const isPaid = monthlyPrice > 0;
                const suffix = isPaid
                  ? isYearly
                    ? t("subscriptionPage.billingToggle.suffixYearly")
                    : t("subscriptionPage.billingToggle.suffixMonthly")
                  : undefined;

                return (
                  <motion.div
                    key={planDef.id}
                    variants={v.item}
                    className={`relative rounded-3xl border p-6 ${
                      planDef.highlight
                        ? "border-brand bg-white shadow-[0_26px_70px_-45px_rgba(249,115,22,0.55)]"
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
                          {t("subscriptionPage.billingToggle.badge")}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                        {t(`subscriptionPage.plans.${i18nKey}.name`)}
                      </p>
                      {isCurrent && (
                        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                          {t("subscriptionPage.currentPlan")}
                        </span>
                      )}
                    </div>

                    {/* Price with animation */}
                    <div className="mt-3 h-10 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={`${planDef.id}-${billing}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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

                    {/* Monthly equivalent hint — fixed height to avoid layout shift */}
                    <div className="mt-1 h-4">
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
                              ? t("subscriptionPage.billingToggle.yearlyEquivalent").replace("__price__", (yearlyPrice / 12).toFixed(2))
                              : t("subscriptionPage.billingToggle.monthlyHint").replace("__price__", String(yearlyPrice))}
                          </motion.p>
                        </AnimatePresence>
                      )}
                    </div>

                    <div className="mt-5 space-y-2 text-sm">
                      {perks.map((perk: string) => {
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

                    <div className="mt-6">
                      {isCurrent && hasStripeCustomer && planDef.priceAmount > 0 ? (
                        <button
                          onClick={handleManageBilling}
                          className="inline-flex w-full items-center justify-center rounded-full border border-line-strong bg-white/70 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
                        >
                          {t("subscriptionPage.manageBilling")}
                        </button>
                      ) : isUpgrade ? (
                        <button
                          onClick={() => handleUpgrade(planDef.id)}
                          className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                            planDef.highlight
                              ? "bg-brand text-white hover:translate-y-[-1px]"
                              : "border border-line-strong bg-white/70 text-ink hover:bg-white"
                          }`}
                        >
                          {t("subscriptionPage.upgrade")}
                        </button>
                      ) : (
                        <div className="inline-flex w-full items-center justify-center rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium text-ink-muted">
                          {t("subscriptionPage.currentPlan")}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}
