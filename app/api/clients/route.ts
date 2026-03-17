import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"
import { withAuthenticatedRoute } from "@/server/auth-helpers"

export async function GET() {
  return withAuthenticatedRoute(async (userId) => {
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { projects: true, workSessions: true } },
      },
    })

    return NextResponse.json({ clients })
  })
}
