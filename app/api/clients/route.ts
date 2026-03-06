import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET() {
  const userId = await getSessionUserId()
  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { projects: true, workSessions: true } },
    },
  })

  return NextResponse.json({ clients })
}
