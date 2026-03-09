import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET() {
  const userId = await getSessionUserId()
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ bankAccounts })
}
