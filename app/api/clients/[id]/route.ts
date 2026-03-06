import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId()

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId },
    include: {
      projects: {
        orderBy: { name: "asc" },
        include: {
          serviceType: { select: { id: true, name: true, color: true } },
          _count: { select: { workSessions: true } },
        },
      },
      workSessions: {
        orderBy: { startedAt: "desc" },
        include: {
          project: { select: { id: true, name: true } },
          breaks: true,
        },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
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
      },
      _count: { select: { projects: true, workSessions: true } },
    },
  })

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  return NextResponse.json({ client })
}
