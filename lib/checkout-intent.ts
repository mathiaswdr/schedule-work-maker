import type { BillingPeriod, PlanId } from "@/lib/plans";

export const DEFAULT_TRIAL_PLAN: PlanId = "PRO";
export const DEFAULT_TRIAL_BILLING: BillingPeriod = "monthly";
export const SUBSCRIPTION_TRIAL_DAYS = 7;

export function buildSubscriptionCheckoutPath(
  plan: PlanId = DEFAULT_TRIAL_PLAN,
  billing: BillingPeriod = DEFAULT_TRIAL_BILLING,
) {
  return `/dashboard/subscription?checkout=${plan}&billing=${billing}`;
}

export function buildLoginCheckoutHref(
  plan: PlanId = DEFAULT_TRIAL_PLAN,
  billing: BillingPeriod = DEFAULT_TRIAL_BILLING,
) {
  const callbackUrl = buildSubscriptionCheckoutPath(plan, billing);
  return `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
