import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET() {
  const userId = await getSessionUserId()

  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ expenses })
}
