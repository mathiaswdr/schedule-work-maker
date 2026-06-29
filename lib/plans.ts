import {
  formatPricingAmount,
  normalizePricingCurrency,
  pricingCurrencies,
  type PricingCurrency,
} from "@/lib/pricing-currency";

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

const PLAN_CURRENCY_PRICES: Record<
  PricingCurrency,
  Partial<Record<PlanId, Pick<PlanDefinition, "priceAmount" | "yearlyPriceAmount" | "compareAtPriceAmount">>>
> = {
  CHF: {
    FREE: { priceAmount: 0, yearlyPriceAmount: 0 },
    STARTER: { priceAmount: 9.9, yearlyPriceAmount: 99 },
    PRO: { priceAmount: 9.9, yearlyPriceAmount: 99 },
    LIFETIME: { priceAmount: 149, yearlyPriceAmount: 149, compareAtPriceAmount: 249 },
  },
  EUR: {
    FREE: { priceAmount: 0, yearlyPriceAmount: 0 },
    STARTER: { priceAmount: 9.9, yearlyPriceAmount: 99 },
    PRO: { priceAmount: 9.9, yearlyPriceAmount: 99 },
    LIFETIME: { priceAmount: 149, yearlyPriceAmount: 149, compareAtPriceAmount: 249 },
  },
  USD: {
    FREE: { priceAmount: 0, yearlyPriceAmount: 0 },
    STARTER: { priceAmount: 9.9, yearlyPriceAmount: 99 },
    PRO: { priceAmount: 9.9, yearlyPriceAmount: 99 },
    LIFETIME: { priceAmount: 149, yearlyPriceAmount: 149, compareAtPriceAmount: 249 },
  },
};

const STRIPE_PRICE_ENV_VARS: Record<
  PricingCurrency,
  Partial<Record<PlanId, { monthly: string | null; yearly: string | null; fallbackMonthly?: string | null; fallbackYearly?: string | null }>>
> = {
  CHF: {
    STARTER: {
      monthly: "PRO_SUBSCRIPTION_PRICE_ID_CHF",
      yearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID_CHF",
      fallbackMonthly: "PRO_SUBSCRIPTION_PRICE_ID",
      fallbackYearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID",
    },
    PRO: {
      monthly: "PRO_SUBSCRIPTION_PRICE_ID_CHF",
      yearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID_CHF",
      fallbackMonthly: "PRO_SUBSCRIPTION_PRICE_ID",
      fallbackYearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID",
    },
    LIFETIME: {
      monthly: "LIFETIME_PRICE_ID_CHF",
      yearly: null,
      fallbackMonthly: "LIFETIME_PRICE_ID",
    },
  },
  EUR: {
    STARTER: { monthly: "PRO_SUBSCRIPTION_PRICE_ID_EUR", yearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID_EUR" },
    PRO: { monthly: "PRO_SUBSCRIPTION_PRICE_ID_EUR", yearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID_EUR" },
    LIFETIME: { monthly: "LIFETIME_PRICE_ID_EUR", yearly: null },
  },
  USD: {
    STARTER: { monthly: "PRO_SUBSCRIPTION_PRICE_ID_USD", yearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID_USD" },
    PRO: { monthly: "PRO_SUBSCRIPTION_PRICE_ID_USD", yearly: "PRO_SUBSCRIPTION_YEAR_PRICE_ID_USD" },
    LIFETIME: { monthly: "LIFETIME_PRICE_ID_USD", yearly: null },
  },
};

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

export function getPlanCurrencyPrice(
  planId: PlanId,
  currency: PricingCurrency,
) {
  const normalizedPlanId = normalizePlanId(planId);
  const plan = PLANS.find((p) => p.id === normalizedPlanId || p.id === planId);
  const prices = PLAN_CURRENCY_PRICES[currency][normalizedPlanId] ?? PLAN_CURRENCY_PRICES.CHF[normalizedPlanId];

  return {
    priceAmount: prices?.priceAmount ?? plan?.priceAmount ?? 0,
    yearlyPriceAmount: prices?.yearlyPriceAmount ?? plan?.yearlyPriceAmount ?? 0,
    compareAtPriceAmount: prices?.compareAtPriceAmount ?? plan?.compareAtPriceAmount,
  };
}

export function formatPlanAmount(
  amount: number,
  currency: PricingCurrency,
  locale: string,
) {
  return formatPricingAmount(amount, currency, locale);
}

export function getPlanDisplayName(plan: string | null | undefined): string {
  const normalizedPlan = normalizePlanId(plan);
  if (normalizedPlan === "LIFETIME") return "Lifetime";
  return normalizedPlan === "PRO" ? "Pro" : "Free";
}

function getStripePriceEnvVars(
  planId: PlanId,
  billing: BillingPeriod,
  currency: PricingCurrency,
) {
  const normalizedPlanId = normalizePlanId(planId);
  const plan = PLANS.find((p) => p.id === normalizedPlanId || p.id === planId);
  if (!plan) return [];
  const currencyEnv = STRIPE_PRICE_ENV_VARS[currency][normalizedPlanId];
  const fallbackEnvVar =
    plan.billingType === "lifetime"
      ? (currencyEnv?.fallbackMonthly ?? plan.stripePriceEnvVar)
      : billing === "yearly"
        ? (currencyEnv?.fallbackYearly ?? plan.stripeYearlyPriceEnvVar)
        : (currencyEnv?.fallbackMonthly ?? plan.stripePriceEnvVar);

  const primaryEnvVar = plan.billingType === "lifetime"
    ? (currencyEnv?.monthly ?? fallbackEnvVar)
    : billing === "yearly"
      ? (currencyEnv?.yearly ?? fallbackEnvVar)
      : (currencyEnv?.monthly ?? fallbackEnvVar);

  return [primaryEnvVar, fallbackEnvVar].filter(
    (envVar, index, envVars): envVar is string =>
      Boolean(envVar) && envVars.indexOf(envVar) === index,
  );
}

export function getStripePriceId(
  planId: PlanId,
  billing: BillingPeriod = "monthly",
  currency: PricingCurrency = "CHF",
): string | null {
  const normalizedCurrency = normalizePricingCurrency(currency) ?? "CHF";
  const envVars = getStripePriceEnvVars(planId, billing, normalizedCurrency);
  for (const envVar of envVars) {
    const priceId = process.env[envVar];
    if (priceId) return priceId;
  }
  return null;
}

export function getPlanByStripePrice(priceId: string): PlanId {
  const lifetimePriceIds = pricingCurrencies
    .flatMap((currency) => getStripePriceEnvVars("LIFETIME", "monthly", currency))
    .flatMap((envVar) => (envVar ? [process.env[envVar]] : []));

  if (lifetimePriceIds.includes(priceId)) return "LIFETIME";

  const proPriceIds = pricingCurrencies.flatMap((currency) =>
    (["monthly", "yearly"] as const)
      .flatMap((billing) => getStripePriceEnvVars("PRO", billing, currency))
      .flatMap((envVar) => (envVar ? [process.env[envVar]] : [])),
  );

  if (proPriceIds.includes(priceId)) return "PRO";

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
