import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET() {
  const userId = await getSessionUserId()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await prisma.invoice.aggregate({
    where: {
      userId,
      status: "PAID",
      issueDate: { gte: monthStart },
    },
    _sum: { total: true },
  })

  return NextResponse.json({
    monthTotal: result._sum.total ?? 0,
  })
}
