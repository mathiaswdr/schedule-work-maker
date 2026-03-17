import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"
import { withAuthenticatedRoute } from "@/server/auth-helpers"

export async function GET() {
  return withAuthenticatedRoute(async (userId) => {
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
  })
}
