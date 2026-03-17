import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"
import { withAuthenticatedRoute } from "@/server/auth-helpers"

export async function GET() {
  return withAuthenticatedRoute(async (userId) => {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ bankAccounts })
  })
}
