import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET(request: Request) {
  const userId = await getSessionUserId()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")

  const where: { userId: string; OR?: { clientId: string | null }[] } = { userId }
  if (clientId) {
    where.OR = [{ clientId }, { clientId: null }]
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      client: { select: { id: true, name: true, color: true } },
      serviceType: { select: { id: true, name: true, color: true } },
      _count: { select: { workSessions: true } },
    },
  })

  return NextResponse.json({ projects })
}
