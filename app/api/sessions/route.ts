import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET() {
  const userId = await getSessionUserId()

  const [activeSession, sessions] = await Promise.all([
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
      include: {
        breaks: { orderBy: { startedAt: "asc" } },
        client: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
      },
    }),
  ])

  return NextResponse.json({ activeSession, sessions })
}
