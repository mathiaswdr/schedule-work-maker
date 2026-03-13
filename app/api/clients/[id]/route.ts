import { NextResponse } from "next/server";
import { getSessionUserId } from "@/server/work-sessions";
import { prisma } from "@/server/prisma";

const DEFAULT_SESSION_LIMIT = 20;
const DEFAULT_INVOICE_LIMIT = 20;

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
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  const { searchParams } = new URL(request.url);
  const sessionOffset = Math.max(
    Number(searchParams.get("sessionOffset") ?? "0"),
    0
  );
  const invoiceOffset = Math.max(
    Number(searchParams.get("invoiceOffset") ?? "0"),
    0
  );
  const sessionLimit = Math.min(
    Math.max(
      Number(searchParams.get("sessionLimit") ?? String(DEFAULT_SESSION_LIMIT)),
      1
    ),
    100
  );
  const invoiceLimit = Math.min(
    Math.max(
      Number(searchParams.get("invoiceLimit") ?? String(DEFAULT_INVOICE_LIMIT)),
      1
    ),
    100
  );

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true,
      name: true,
      email: true,
      color: true,
      notes: true,
      address: true,
      postalCode: true,
      city: true,
      country: true,
      _count: { select: { projects: true, workSessions: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const [projects, analyticsSessions, recentSessions, recentInvoices, invoiceTotals] =
    await Promise.all([
      prisma.project.findMany({
        where: { clientId: params.id, userId },
        orderBy: { name: "asc" },
        include: {
          serviceType: { select: { id: true, name: true, color: true } },
          _count: { select: { workSessions: true } },
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
      prisma.workSession.findMany({
        where: { clientId: params.id, userId },
        orderBy: { startedAt: "desc" },
        skip: sessionOffset,
        take: sessionLimit + 1,
        select: {
          id: true,
          status: true,
          startedAt: true,
          endedAt: true,
          project: { select: { id: true, name: true } },
          breaks: {
            select: {
              startedAt: true,
              endedAt: true,
            },
          },
        },
      }),
      prisma.invoice.findMany({
        where: { clientId: params.id, userId },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        skip: invoiceOffset,
        take: invoiceLimit + 1,
        select: {
          id: true,
          displayNumber: true,
          status: true,
          source: true,
          total: true,
          issueDate: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.invoice.groupBy({
        by: ["status"],
        where: { clientId: params.id, userId },
        _sum: { total: true },
      }),
    ]);

  const now = new Date();
  const recentSessionsHasMore = recentSessions.length > sessionLimit;
  const recentInvoicesHasMore = recentInvoices.length > invoiceLimit;
  const paginatedSessions = recentSessionsHasMore
    ? recentSessions.slice(0, sessionLimit)
    : recentSessions;
  const paginatedInvoices = recentInvoicesHasMore
    ? recentInvoices.slice(0, invoiceLimit)
    : recentInvoices;

  const projectMeta = new Map(
    projects.map((project) => [
      project.id,
      {
        name: project.name,
        color: project.serviceType?.color ?? client.color ?? "#3B82F6",
      },
    ])
  );

  const totalTimeMs = analyticsSessions.reduce(
    (total, session) => total + getSessionMs(session, session.breaks, now),
    0
  );
  const totalBreakMs = analyticsSessions.reduce(
    (total, session) => total + getBreakMs(session.breaks, now),
    0
  );
  const totalBreakCount = analyticsSessions.reduce(
    (total, session) => total + session.breaks.length,
    0
  );
  const longestSessionMs = analyticsSessions.reduce(
    (max, session) => Math.max(max, getSessionMs(session, session.breaks, now)),
    0
  );
  const avgSessionMs =
    analyticsSessions.length > 0 ? totalTimeMs / analyticsSessions.length : 0;
  const avgBreakMs =
    totalBreakCount > 0 ? totalBreakMs / totalBreakCount : 0;
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

  for (const session of analyticsSessions) {
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
  for (const session of analyticsSessions) {
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
    client,
    projects,
    recentSessions: paginatedSessions,
    recentInvoices: paginatedInvoices,
    hasMoreSessions: recentSessionsHasMore,
    hasMoreInvoices: recentInvoicesHasMore,
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
