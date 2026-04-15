import { Suspense } from "react";
import { DM_Serif_Display } from "next/font/google";
import { prisma } from "@/server/prisma";
import {
  getActiveSession,
  getWorkSummary,
} from "@/server/work-sessions";
import StatsClient from "@/components/dashboard/stats-client";
import PlanGate from "@/components/dashboard/plan-gate";
import DashboardPageFallback from "@/components/dashboard/dashboard-page-fallback";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const getWeekNumber = (date: Date) => {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
};

async function ProductivityStatsContent() {
  const { userId, userPlan, currency, hourlyRate } = await getDashboardViewer();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [summary, activeSession, invoiceAgg] = await Promise.all([
    getWorkSummary(userId),
    getActiveSession(userId),
    prisma.invoice.aggregate({
      where: { userId, status: "PAID", issueDate: { gte: monthStart } },
      _sum: { total: true },
    }),
  ]);

  const invoiceRevenue = invoiceAgg._sum.total ?? 0;

  const weekDays = summary.weekDays.length
    ? summary.weekDays
    : Array.from({ length: 5 }, (_, index) => {
        const base = new Date();
        const weekStart = new Date(base);
        weekStart.setDate(
          base.getDate() - ((base.getDay() + 6) % 7) + index
        );
        return {
          date: weekStart.toISOString(),
          valueMs: 0,
          breakMs: 0,
          breakCount: 0,
        };
      });

  const maxWeekMs = Math.max(...weekDays.map((d) => d.valueMs), 1);
  const weekNumber = getWeekNumber(new Date());

  const productivity =
    summary.todayMs + summary.breakMs > 0
      ? Math.round(
          (summary.todayMs / (summary.todayMs + summary.breakMs)) * 100
        )
      : 0;

  const breakAverage =
    summary.breakCount > 0
      ? Math.round(summary.breakMs / summary.breakCount / 60000)
      : 0;

  const daysActive = summary.weekDays.filter((d) => d.valueMs > 0).length;

  const timezone =
    activeSession?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="stats">
      <StatsClient
        displayClassName={display.className}
        currency={currency}
        hourlyRate={hourlyRate}
        invoiceRevenue={invoiceRevenue}
        summary={{
          todayMs: summary.todayMs,
          weekMs: summary.weekMs,
          breakMs: summary.breakMs,
          breakCount: summary.breakCount,
        }}
        weekDays={weekDays}
        maxWeekMs={maxWeekMs}
        weekNumber={weekNumber}
        productivity={productivity}
        breakAverage={breakAverage}
        daysActive={daysActive}
        timezone={timezone}
      />
    </PlanGate>
  );
}

export default function DashboardProductivityStatsPage() {
  return (
    <Suspense fallback={<DashboardPageFallback statsCards={6} sectionBlocks={2} />}>
      <ProductivityStatsContent />
    </Suspense>
  );
}
