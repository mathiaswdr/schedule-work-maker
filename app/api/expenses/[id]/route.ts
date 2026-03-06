import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId()

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
}
