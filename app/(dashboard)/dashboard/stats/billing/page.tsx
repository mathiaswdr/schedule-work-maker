import { Suspense } from "react";
import { DM_Serif_Display } from "next/font/google";
import { getBillingStats } from "@/server/billing-stats";
import BillingStatsClient from "@/components/dashboard/billing-stats-client";
import PlanGate from "@/components/dashboard/plan-gate";
import DashboardPageFallback from "@/components/dashboard/dashboard-page-fallback";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

async function BillingStatsContent() {
  const { userId, userPlan, currency } = await getDashboardViewer();
  const billingStats = await getBillingStats(userId);

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="stats">
      <BillingStatsClient
        displayClassName={display.className}
        currency={currency}
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

export default function DashboardBillingStatsPage() {
  return (
    <Suspense fallback={<DashboardPageFallback statsCards={6} sectionBlocks={2} />}>
      <BillingStatsContent />
    </Suspense>
  );
}
