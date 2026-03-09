import { prisma } from "@/server/prisma";
import { type PlanId, PLAN_LIMITS } from "@/lib/plans";

export type LimitResult = { allowed: boolean; current: number; max: number | null };

export async function checkClientLimit(userId: string, plan: PlanId): Promise<LimitResult> {
  const limits = PLAN_LIMITS[plan];
  if (limits.clients === null) return { allowed: true, current: 0, max: null };

  const current = await prisma.client.count({ where: { userId } });
  return { allowed: current < limits.clients, current, max: limits.clients };
}

export async function checkInvoiceMonthlyLimit(userId: string, plan: PlanId): Promise<LimitResult> {
  const limits = PLAN_LIMITS[plan];
  if (limits.invoicesPerMonth === null) return { allowed: true, current: 0, max: null };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const current = await prisma.invoice.count({
    where: { userId, createdAt: { gte: monthStart } },
  });

  return { allowed: current < limits.invoicesPerMonth, current, max: limits.invoicesPerMonth };
}
