import { DM_Serif_Display } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { getSessionUserId } from "@/server/work-sessions";
import { getBillingStats } from "@/server/billing-stats";
import BillingStatsClient from "@/components/dashboard/billing-stats-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { type PlanId } from "@/lib/plans";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function DashboardBillingStatsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const userId = await getSessionUserId();

  const [user, billingStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    }),
    getBillingStats(userId),
  ]);

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="stats">
      <BillingStatsClient
        displayClassName={display.className}
        currency={user?.currency ?? "CHF"}
        summary={billingStats.summary}
        dailyPoints={billingStats.dailyPoints}
        monthlyPoints={billingStats.monthlyPoints}
        yearlyPoints={billingStats.yearlyPoints}
        statusBreakdown={billingStats.statusBreakdown}
        topClients={billingStats.topClients}
        topProjects={billingStats.topProjects}
        clientPaymentPoints={billingStats.clientPaymentPoints}
      />
    </PlanGate>
  );
}
