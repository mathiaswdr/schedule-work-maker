import { DM_Serif_Display } from "next/font/google";
import { prisma } from "@/server/prisma";
import {
  getEndedSessionMonthStats,
} from "@/server/work-sessions";
import SessionsClient from "@/components/dashboard/sessions-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const INITIAL_SESSIONS_PAGE_SIZE = 20;

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function DashboardSessionsPage() {
  const { userId, userPlan, currency, hourlyRate } = await getDashboardViewer();

  const [initialActiveSession, initialSessions, initialMonthStats] = await Promise.all([
    prisma.workSession.findFirst({
      where: {
        userId,
        endedAt: null,
      },
      orderBy: { startedAt: "desc" },
      include: {
        breaks: { orderBy: { startedAt: "asc" } },
        client: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.workSession.findMany({
      where: {
        userId,
        status: "ENDED",
      },
      orderBy: { startedAt: "desc" },
      take: INITIAL_SESSIONS_PAGE_SIZE + 1,
      include: {
        breaks: { orderBy: { startedAt: "asc" } },
        client: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    getEndedSessionMonthStats(userId),
  ]);

  const hasMoreInitialSessions =
    initialSessions.length > INITIAL_SESSIONS_PAGE_SIZE;
  const paginatedInitialSessions = hasMoreInitialSessions
    ? initialSessions.slice(0, INITIAL_SESSIONS_PAGE_SIZE)
    : initialSessions;

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="sessions">
      <SessionsClient
        displayClassName={display.className}
        currency={currency}
        hourlyRate={hourlyRate}
        initialActiveSession={serializeForClient(initialActiveSession)}
        initialSessions={serializeForClient(paginatedInitialSessions)}
        initialHasMore={hasMoreInitialSessions}
        initialMonthStats={serializeForClient(initialMonthStats)}
      />
    </PlanGate>
  );
}
