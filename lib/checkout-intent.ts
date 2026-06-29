import type { BillingPeriod, PlanId } from "@/lib/plans";
import type { PricingCurrency } from "@/lib/pricing-currency";

export const DEFAULT_TRIAL_PLAN: PlanId = "PRO";
export const DEFAULT_TRIAL_BILLING: BillingPeriod = "monthly";
export const SUBSCRIPTION_TRIAL_DAYS = 7;

export function buildSubscriptionCheckoutPath(
  plan: PlanId = DEFAULT_TRIAL_PLAN,
  billing: BillingPeriod = DEFAULT_TRIAL_BILLING,
  currency?: PricingCurrency,
) {
  const params = new URLSearchParams({ checkout: plan, billing });
  if (currency) params.set("currency", currency);
  return `/dashboard/subscription?${params.toString()}`;
}

export function buildLoginCheckoutHref(
  plan: PlanId = DEFAULT_TRIAL_PLAN,
  billing: BillingPeriod = DEFAULT_TRIAL_BILLING,
  currency?: PricingCurrency,
) {
  const callbackUrl = buildSubscriptionCheckoutPath(plan, billing, currency);
  return `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function buildSignupCheckoutHref(
  plan: PlanId = DEFAULT_TRIAL_PLAN,
  billing: BillingPeriod = DEFAULT_TRIAL_BILLING,
  currency?: PricingCurrency,
) {
  const callbackUrl = buildSubscriptionCheckoutPath(plan, billing, currency);
  return `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
