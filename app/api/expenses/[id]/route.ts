import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"
import { withAuthenticatedRoute } from "@/server/auth-helpers"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return withAuthenticatedRoute(async (userId) => {
    const expense = await prisma.expense.findFirst({
      where: { id: params.id, userId },
      include: {
        receipts: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ expense })
  })
}
