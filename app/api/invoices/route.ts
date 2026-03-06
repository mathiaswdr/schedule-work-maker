import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      client: { select: { name: true, color: true } },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}
