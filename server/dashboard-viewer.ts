import { cache } from "react";
import { redirect } from "next/navigation";

import { type PlanId } from "@/lib/plans";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";

export const getDashboardSession = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return session;
});

export const getDashboardUserId = cache(async () => {
  const session = await getDashboardSession();
  return session.user.id;
});

export const getDashboardUser = cache(async () => {
  const userId = await getDashboardUserId();

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      currency: true,
      hourlyRate: true,
      plan: true,
      stripeCustomerId: true,
    },
  });
});

export const getDashboardViewer = cache(async () => {
  const [session, user] = await Promise.all([
    getDashboardSession(),
    getDashboardUser(),
  ]);

  return {
    session,
    userId: session.user.id,
    userPlan: ((user?.plan ?? session.user.plan ?? "FREE") as PlanId),
    currency: user?.currency ?? "CHF",
    hourlyRate: user?.hourlyRate ?? 0,
    stripeCustomerId: user?.stripeCustomerId ?? null,
  };
});
