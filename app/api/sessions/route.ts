import { NextResponse } from "next/server";
import {
  getEndedSessionMonthStats,
  getSessionUserId,
} from "@/server/work-sessions";
import { prisma } from "@/server/prisma";

const DEFAULT_LIMIT = 20;

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  const { searchParams } = new URL(request.url);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? String(DEFAULT_LIMIT)), 1),
    100
  );

  const [activeSession, sessions, monthStats] = await Promise.all([
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
      skip: offset,
      take: limit + 1,
      include: {
        breaks: { orderBy: { startedAt: "asc" } },
        client: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    getEndedSessionMonthStats(userId),
  ]);

  const hasMore = sessions.length > limit;
  const paginatedSessions = hasMore ? sessions.slice(0, limit) : sessions;

  return NextResponse.json({
    activeSession,
    sessions: paginatedSessions,
    hasMore,
    monthStats,
  });
}
