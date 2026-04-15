import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"
import { withAuthenticatedRoute } from "@/server/auth-helpers"

export async function GET() {
  return withAuthenticatedRoute(async (userId) => {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: {
        invoices: {
          select: {
            id: true,
            amount: true,
            billedAt: true,
          },
          orderBy: [{ billedAt: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ expenses })
  })
}
