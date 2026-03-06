import { NextResponse } from "next/server"
import { getSessionUserId } from "@/server/work-sessions"
import { prisma } from "@/server/prisma"

export async function GET() {
  const userId = await getSessionUserId()
  const serviceTypes = await prisma.serviceType.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ serviceTypes })
}
