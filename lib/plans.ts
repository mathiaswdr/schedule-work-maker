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

// ── Feature gating ──────────────────────────────────────────────

export type FeatureKey =
  | "time"
  | "sessions"
  | "clients"
  | "projects"
  | "invoices"
  | "expenses"
  | "stats"
  | "subscription"
  | "settings";

/** Minimum plan required to access a feature (for sidebar badge + PlanGate). */
export const FEATURE_PLAN_MAP: Record<FeatureKey, PlanId> = {
  time: "FREE",
  clients: "FREE",
  invoices: "FREE",
  subscription: "FREE",
  settings: "FREE",
  sessions: "STARTER",
  projects: "STARTER",
  stats: "PRO",
  expenses: "PRO",
};

/** Quantitative limits per plan. `null` means unlimited. */
export const PLAN_LIMITS: Record<PlanId, { clients: number | null; invoicesPerMonth: number | null }> = {
  FREE: { clients: 2, invoicesPerMonth: 5 },
  STARTER: { clients: null, invoicesPerMonth: null },
  PRO: { clients: null, invoicesPerMonth: null },
};

/** Returns true if `userPlan` is equal or higher than `requiredPlan`. */
export function isPlanSufficient(userPlan: PlanId, requiredPlan: PlanId): boolean {
  const user = PLANS.find((p) => p.id === userPlan);
  const required = PLANS.find((p) => p.id === requiredPlan);
  if (!user || !required) return false;
  return user.sortOrder >= required.sortOrder;
}

/** Returns the limits for a given plan. */
export function getPlanLimits(plan: PlanId) {
  return PLAN_LIMITS[plan];
}
