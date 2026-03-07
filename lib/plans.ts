export type PlanId = "FREE" | "STARTER" | "PRO";
export type BillingPeriod = "monthly" | "yearly";

export type PlanDefinition = {
  id: PlanId;
  i18nKey: string;
  stripePriceEnvVar: string | null;
  stripeYearlyPriceEnvVar: string | null;
  priceAmount: number;
  yearlyPriceAmount: number;
  highlight: boolean;
  sortOrder: number;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "FREE",
    i18nKey: "free",
    stripePriceEnvVar: null,
    stripeYearlyPriceEnvVar: null,
    priceAmount: 0,
    yearlyPriceAmount: 0,
    highlight: false,
    sortOrder: 0,
  },
  {
    id: "STARTER",
    i18nKey: "starter",
    stripePriceEnvVar: "SUBSCRIPTION_PRICE_ID",
    stripeYearlyPriceEnvVar: "SUBSCRIPTION_YEAR_PRICE_ID",
    priceAmount: 9.9,
    yearlyPriceAmount: 99,
    highlight: true,
    sortOrder: 1,
  },
  {
    id: "PRO",
    i18nKey: "pro",
    stripePriceEnvVar: "PRO_SUBSCRIPTION_PRICE_ID",
    stripeYearlyPriceEnvVar: "PRO_SUBSCRIPTION_YEAR_PRICE_ID",
    priceAmount: 19,
    yearlyPriceAmount: 199,
    highlight: false,
    sortOrder: 2,
  },
];

export function getStripePriceId(planId: PlanId, billing: BillingPeriod = "monthly"): string | null {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  const envVar = billing === "yearly" ? plan.stripeYearlyPriceEnvVar : plan.stripePriceEnvVar;
  if (!envVar) return null;
  return process.env[envVar] ?? null;
}

export function getPlanByStripePrice(priceId: string): PlanId {
  for (const plan of PLANS) {
    if (plan.stripePriceEnvVar && process.env[plan.stripePriceEnvVar] === priceId) return plan.id;
    if (plan.stripeYearlyPriceEnvVar && process.env[plan.stripeYearlyPriceEnvVar] === priceId) return plan.id;
  }
  return "PRO";
}

export function canUpgrade(current: string, target: PlanId): boolean {
  const currentPlan = PLANS.find((p) => p.id === current);
  const targetPlan = PLANS.find((p) => p.id === target);
  if (!currentPlan || !targetPlan) return false;
  return targetPlan.sortOrder > currentPlan.sortOrder;
}
