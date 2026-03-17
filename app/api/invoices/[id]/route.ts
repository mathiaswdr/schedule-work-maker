import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      client: { select: { name: true, email: true, color: true } },
      project: { select: { name: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}
