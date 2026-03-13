import { NextResponse } from "next/server";
import { getSessionUserId } from "@/server/work-sessions";
import { prisma } from "@/server/prisma";

const getBreakMs = (
  breaks: { startedAt: Date; endedAt: Date | null }[],
  now: Date
) =>
  breaks.reduce((total, pause) => {
    const end = pause.endedAt ?? now;
    return total + (end.getTime() - pause.startedAt.getTime());
  }, 0);

const getSessionMs = (
  session: { startedAt: Date; endedAt: Date | null },
  breaks: { startedAt: Date; endedAt: Date | null }[],
  now: Date
) => {
  const end = session.endedAt ?? now;
  return Math.max(
    end.getTime() - session.startedAt.getTime() - getBreakMs(breaks, now),
    0
  );
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId },
    select: { id: true, color: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const [projects, sessions, invoiceTotals] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: params.id, userId },
      select: {
        id: true,
        name: true,
        serviceType: { select: { color: true } },
      },
    }),
    prisma.workSession.findMany({
      where: { clientId: params.id, userId },
      select: {
        startedAt: true,
        endedAt: true,
        projectId: true,
        breaks: {
          select: {
            startedAt: true,
            endedAt: true,
          },
        },
      },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { clientId: params.id, userId },
      _sum: { total: true },
    }),
  ]);

  const now = new Date();
  const projectMeta = new Map(
    projects.map((project) => [
      project.id,
      {
        name: project.name,
        color: project.serviceType?.color ?? client.color ?? "#3B82F6",
      },
    ])
  );

  const totalTimeMs = sessions.reduce(
    (total, session) => total + getSessionMs(session, session.breaks, now),
    0
  );
  const totalBreakMs = sessions.reduce(
    (total, session) => total + getBreakMs(session.breaks, now),
    0
  );
  const totalBreakCount = sessions.reduce(
    (total, session) => total + session.breaks.length,
    0
  );
  const longestSessionMs = sessions.reduce(
    (max, session) => Math.max(max, getSessionMs(session, session.breaks, now)),
    0
  );
  const avgSessionMs = sessions.length > 0 ? totalTimeMs / sessions.length : 0;
  const avgBreakMs = totalBreakCount > 0 ? totalBreakMs / totalBreakCount : 0;
  const productivityPct =
    totalTimeMs + totalBreakMs > 0
      ? Math.round((totalTimeMs / (totalTimeMs + totalBreakMs)) * 100)
      : 0;

  const dailyActivityBase = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (13 - index));
    date.setHours(0, 0, 0, 0);
    return { date, ms: 0 };
  });

  for (const session of sessions) {
    const sessionDate = new Date(session.startedAt);
    sessionDate.setHours(0, 0, 0, 0);
    const match = dailyActivityBase.find(
      (day) => day.date.getTime() === sessionDate.getTime()
    );
    if (match) {
      match.ms += getSessionMs(session, session.breaks, now);
    }
  }

  const timeByProjectMap = new Map<string, { name: string; color: string; ms: number }>();
  for (const session of sessions) {
    const key = session.projectId ?? "__none__";
    const meta = session.projectId
      ? projectMeta.get(session.projectId)
      : { name: "Sans projet", color: "#9CA3AF" };
    const current = timeByProjectMap.get(key) ?? {
      name: meta?.name ?? "Sans projet",
      color: meta?.color ?? "#9CA3AF",
      ms: 0,
    };
    current.ms += getSessionMs(session, session.breaks, now);
    timeByProjectMap.set(key, current);
  }

  const paidTotal = invoiceTotals
    .filter((entry) => entry.status === "PAID")
    .reduce((total, entry) => total + Number(entry._sum.total ?? 0), 0);
  const pendingTotal = invoiceTotals
    .filter((entry) => entry.status !== "PAID")
    .reduce((total, entry) => total + Number(entry._sum.total ?? 0), 0);

  return NextResponse.json({
    analytics: {
      totalTimeMs,
      totalBreakMs,
      totalBreakCount,
      avgSessionMs,
      longestSessionMs,
      productivityPct,
      avgBreakMs,
      dailyActivity: dailyActivityBase.map((day) => ({
        date: day.date.toISOString(),
        ms: day.ms,
      })),
      timeByProject: Array.from(timeByProjectMap.values()).sort(
        (a, b) => b.ms - a.ms
      ),
      invoiceTotals: {
        pending: pendingTotal,
        paid: paidTotal,
      },
    },
  });
}
