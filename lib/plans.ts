export type PlanId = "FREE" | "STARTER" | "PRO" | "LIFETIME";
export type BillingPeriod = "monthly" | "yearly";
export type PlanBillingType = "free" | "subscription" | "lifetime";

export type PlanDefinition = {
  id: PlanId;
  i18nKey: string;
  stripePriceEnvVar: string | null;
  stripeYearlyPriceEnvVar: string | null;
  billingType: PlanBillingType;
  priceAmount: number;
  yearlyPriceAmount: number;
  compareAtPriceAmount?: number;
  highlight: boolean;
  visible: boolean;
  sortOrder: number;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "FREE",
    i18nKey: "free",
    stripePriceEnvVar: null,
    stripeYearlyPriceEnvVar: null,
    billingType: "free",
    priceAmount: 0,
    yearlyPriceAmount: 0,
    highlight: false,
    visible: true,
    sortOrder: 0,
  },
  {
    id: "STARTER",
    i18nKey: "starter",
    stripePriceEnvVar: "SUBSCRIPTION_PRICE_ID",
    stripeYearlyPriceEnvVar: "SUBSCRIPTION_YEAR_PRICE_ID",
    billingType: "subscription",
    priceAmount: 9.9,
    yearlyPriceAmount: 99,
    highlight: false,
    visible: false,
    sortOrder: 1,
  },
  {
    id: "PRO",
    i18nKey: "pro",
    stripePriceEnvVar: "SUBSCRIPTION_PRICE_ID",
    stripeYearlyPriceEnvVar: "SUBSCRIPTION_YEAR_PRICE_ID",
    billingType: "subscription",
    priceAmount: 9.9,
    yearlyPriceAmount: 99,
    highlight: false,
    visible: true,
    sortOrder: 1,
  },
  {
    id: "LIFETIME",
    i18nKey: "lifetime",
    stripePriceEnvVar: "LIFETIME_PRICE_ID",
    stripeYearlyPriceEnvVar: null,
    billingType: "lifetime",
    priceAmount: 149,
    yearlyPriceAmount: 149,
    compareAtPriceAmount: 249,
    highlight: true,
    visible: true,
    sortOrder: 2,
  },
];

export function normalizePlanId(plan: string | null | undefined): PlanId {
  if (plan === "STARTER" || plan === "PRO") return "PRO";
  if (plan === "LIFETIME") return "LIFETIME";
  return "FREE";
}

export function isPlanId(plan: string | null | undefined): plan is PlanId {
  return plan === "FREE" || plan === "STARTER" || plan === "PRO" || plan === "LIFETIME";
}

export function getEntitlementPlanId(plan: string | null | undefined): "FREE" | "PRO" {
  return normalizePlanId(plan) === "FREE" ? "FREE" : "PRO";
}

export function getVisiblePlans() {
  return PLANS.filter((plan) => plan.visible);
}

export function getPlanDisplayName(plan: string | null | undefined): string {
  const normalizedPlan = normalizePlanId(plan);
  if (normalizedPlan === "LIFETIME") return "Lifetime";
  return normalizedPlan === "PRO" ? "Pro" : "Free";
}

export function getStripePriceId(planId: PlanId, billing: BillingPeriod = "monthly"): string | null {
  const normalizedPlanId = normalizePlanId(planId);
  const plan = PLANS.find((p) => p.id === normalizedPlanId || p.id === planId);
  if (!plan) return null;
  const envVar =
    plan.billingType === "lifetime"
      ? plan.stripePriceEnvVar
      : billing === "yearly"
        ? plan.stripeYearlyPriceEnvVar
        : plan.stripePriceEnvVar;
  if (!envVar) return null;
  return process.env[envVar] ?? null;
}

export function getPlanByStripePrice(priceId: string): PlanId {
  if (process.env.LIFETIME_PRICE_ID === priceId) return "LIFETIME";

  const paidPriceIds = [
    process.env.SUBSCRIPTION_PRICE_ID,
    process.env.SUBSCRIPTION_YEAR_PRICE_ID,
    process.env.PRO_SUBSCRIPTION_PRICE_ID,
    process.env.PRO_SUBSCRIPTION_YEAR_PRICE_ID,
  ];

  if (paidPriceIds.includes(priceId)) return "PRO";

  return "PRO";
}

export function canUpgrade(current: string, target: PlanId): boolean {
  const currentPlan = PLANS.find((p) => p.id === normalizePlanId(current));
  const targetPlan = PLANS.find((p) => p.id === normalizePlanId(target));
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
  sessions: "PRO",
  projects: "PRO",
  stats: "PRO",
  expenses: "PRO",
};

/** Quantitative limits per plan. `null` means unlimited. */
export const PLAN_LIMITS: Record<PlanId, { clients: number | null; invoicesPerMonth: number | null }> = {
  FREE: { clients: 2, invoicesPerMonth: 5 },
  STARTER: { clients: null, invoicesPerMonth: null },
  PRO: { clients: null, invoicesPerMonth: null },
  LIFETIME: { clients: null, invoicesPerMonth: null },
};

/** Returns true if `userPlan` is equal or higher than `requiredPlan`. */
export function isPlanSufficient(userPlan: PlanId, requiredPlan: PlanId): boolean {
  const user = PLANS.find((p) => p.id === normalizePlanId(userPlan));
  const required = PLANS.find((p) => p.id === normalizePlanId(requiredPlan));
  if (!user || !required) return false;
  return user.sortOrder >= required.sortOrder;
}

/** Returns the limits for a given plan. */
export function getPlanLimits(plan: PlanId) {
  return PLAN_LIMITS[normalizePlanId(plan)];
}
