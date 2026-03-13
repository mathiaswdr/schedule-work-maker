import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import {
  getEndedSessionMonthStats,
  getSessionUserId,
} from "@/server/work-sessions";
import SessionsClient from "@/components/dashboard/sessions-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { type PlanId } from "@/lib/plans";
import { serializeForClient } from "@/lib/utils";

const INITIAL_SESSIONS_PAGE_SIZE = 20;

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardSessionsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const userId = await getSessionUserId();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true, hourlyRate: true },
      })
    : null;

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
    <PlanGate userPlan={userPlan} requiredPlan="STARTER" feature="sessions">
      <SessionsClient
        displayClassName={display.className}
        currency={user?.currency ?? "CHF"}
        hourlyRate={user?.hourlyRate ?? 0}
        initialActiveSession={serializeForClient(initialActiveSession)}
        initialSessions={serializeForClient(paginatedInitialSessions)}
        initialHasMore={hasMoreInitialSessions}
        initialMonthStats={serializeForClient(initialMonthStats)}
      />
    </PlanGate>
  );
}
