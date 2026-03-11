import { cache } from "react";
import { WorkSessionStatus } from "@prisma/client";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";

const DEMO_EMAIL = "demo@tempowork.local";

export type WorkSummary = {
  todayMs: number;
  weekMs: number;
  breakMs: number;
  breakCount: number;
  weekDays: { date: string; valueMs: number; breakMs: number; breakCount: number }[];
};

export class WorkSessionTransitionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 409) {
    super(message);
    this.name = "WorkSessionTransitionError";
    this.statusCode = statusCode;
  }
}

export const getSessionUserId = cache(async () => {
  const session = await auth();

  if (session?.user?.id) {
    return session.user.id;
  }

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "TempoWork Demo",
    },
  });

  return demoUser.id;
});

export async function getActiveSession(userId: string) {
  return prisma.workSession.findFirst({
    where: {
      userId,
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
    include: {
      breaks: {
        orderBy: { startedAt: "asc" },
      },
      client: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export function getBreakMs(
  breaks: { startedAt: Date; endedAt: Date | null }[],
  now: Date
) {
  return breaks.reduce((total, pause) => {
    const end = pause.endedAt ?? now;
    return total + (end.getTime() - pause.startedAt.getTime());
  }, 0);
}

export function getSessionMs(
  session: { startedAt: Date; endedAt: Date | null },
  breaks: { startedAt: Date; endedAt: Date | null }[],
  now: Date
) {
  const end = session.endedAt ?? now;
  const total = end.getTime() - session.startedAt.getTime();
  const breakMs = getBreakMs(breaks, now);
  return Math.max(total - breakMs, 0);
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const base = startOfDay(date);
  const day = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - day);
  return base;
};

export async function getWorkSummary(userId: string): Promise<WorkSummary> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const sessions = await prisma.workSession.findMany({
    where: {
      userId,
      startedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: {
      breaks: true,
    },
    orderBy: { startedAt: "asc" },
  });

  let todayMs = 0;
  let weekMs = 0;
  let breakMs = 0;
  let breakCount = 0;

  const getBreaksForDay = (
    breaks: { startedAt: Date; endedAt: Date | null }[],
    dayStart: Date,
    dayEnd: Date
  ) => {
    return breaks.reduce(
      (acc, pause) => {
        if (pause.startedAt < dayStart || pause.startedAt >= dayEnd) {
          return acc;
        }
        const end = pause.endedAt ?? now;
        const cappedEnd = end > dayEnd ? dayEnd : end;
        const duration = Math.max(cappedEnd.getTime() - pause.startedAt.getTime(), 0);
        return {
          breakMs: acc.breakMs + duration,
          breakCount: acc.breakCount + 1,
        };
      },
      { breakMs: 0, breakCount: 0 }
    );
  };

  for (const session of sessions) {
    const sessionMs = getSessionMs(session, session.breaks, now);
    weekMs += sessionMs;

    if (session.startedAt >= todayStart && session.startedAt < tomorrowStart) {
      todayMs += sessionMs;
      for (const pause of session.breaks) {
        if (pause.startedAt >= todayStart && pause.startedAt < tomorrowStart) {
          breakCount += 1;
        }
      }
      breakMs += getBreakMs(session.breaks, now);
    }
  }

  const weekDays = Array.from({ length: 5 }, (_, index) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const daySessions = sessions.filter(
      (session) => session.startedAt >= dayStart && session.startedAt < dayEnd
    );

    const valueMs = daySessions.reduce(
      (total, session) => total + getSessionMs(session, session.breaks, now),
      0
    );

    const breakStats = daySessions.reduce(
      (acc, session) => {
        const stats = getBreaksForDay(session.breaks, dayStart, dayEnd);
        return {
          breakMs: acc.breakMs + stats.breakMs,
          breakCount: acc.breakCount + stats.breakCount,
        };
      },
      { breakMs: 0, breakCount: 0 }
    );

    return {
      date: dayStart.toISOString(),
      valueMs,
      breakMs: breakStats.breakMs,
      breakCount: breakStats.breakCount,
    };
  });

  return {
    todayMs,
    weekMs,
    breakMs,
    breakCount,
    weekDays,
  };
}

export async function getRecentSessions(userId: string, limit = 5) {
  return prisma.workSession.findMany({
    where: { userId, status: WorkSessionStatus.ENDED },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      breaks: { orderBy: { startedAt: "asc" } },
      client: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function startSession(
  userId: string,
  timezone?: string,
  clientId?: string,
  projectId?: string
) {
  const now = new Date();
  const session = await getActiveSession(userId);

  if (session) {
    throw new WorkSessionTransitionError("An active session already exists");
  }

  return prisma.workSession.create({
    data: {
      userId,
      status: WorkSessionStatus.RUNNING,
      startedAt: now,
      timezone,
      clientId: clientId ?? null,
      projectId: projectId ?? null,
    },
    include: {
      breaks: true,
      client: { select: { id: true, name: true, color: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function pauseSession(userId: string) {
  const now = new Date();
  const session = await getActiveSession(userId);

  if (!session) {
    throw new WorkSessionTransitionError("No active session to pause");
  }

  if (session.status !== WorkSessionStatus.RUNNING) {
    throw new WorkSessionTransitionError("Only a running session can be paused");
  }

  await prisma.$transaction([
    prisma.workBreak.create({
      data: {
        sessionId: session.id,
        startedAt: now,
      },
    }),
    prisma.workSession.update({
      where: { id: session.id },
      data: { status: WorkSessionStatus.PAUSED },
    }),
  ]);

  return getActiveSession(userId);
}

export async function resumeSession(userId: string) {
  const now = new Date();
  const session = await getActiveSession(userId);

  if (!session) {
    throw new WorkSessionTransitionError("No paused session to resume");
  }

  if (session.status !== WorkSessionStatus.PAUSED) {
    throw new WorkSessionTransitionError("Only a paused session can be resumed");
  }

  const openBreak = session.breaks.find((pause) => !pause.endedAt);

  await prisma.$transaction([
    ...(openBreak
      ? [
          prisma.workBreak.update({
            where: { id: openBreak.id },
            data: { endedAt: now },
          }),
        ]
      : []),
    prisma.workSession.update({
      where: { id: session.id },
      data: { status: WorkSessionStatus.RUNNING },
    }),
  ]);

  return getActiveSession(userId);
}

export async function endSession(userId: string) {
  const now = new Date();
  const session = await getActiveSession(userId);

  if (!session) {
    throw new WorkSessionTransitionError("No active session to end");
  }

  const openBreak = session.breaks.find((pause) => !pause.endedAt);

  await prisma.$transaction([
    ...(openBreak
      ? [
          prisma.workBreak.update({
            where: { id: openBreak.id },
            data: { endedAt: now },
          }),
        ]
      : []),
    prisma.workSession.update({
      where: { id: session.id },
      data: {
        status: WorkSessionStatus.ENDED,
        endedAt: now,
      },
    }),
  ]);

  return getActiveSession(userId);
}
