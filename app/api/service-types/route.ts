import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"
import { withAuthenticatedRoute } from "@/server/auth-helpers"

export async function GET() {
  return withAuthenticatedRoute(async (userId) => {
    const serviceTypes = await prisma.serviceType.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ serviceTypes })
  })
}
