import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 24;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offsetParam = searchParams.get("offset");
  const limitParam = searchParams.get("limit");
  const offset = offsetParam ? Math.max(Number(offsetParam), 0) : null;
  const limit = limitParam
    ? Math.min(Math.max(Number(limitParam), 1), 100)
    : null;

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      number: true,
      displayNumber: true,
      status: true,
      source: true,
      clientId: true,
      projectId: true,
      fileUrl: true,
      issueDate: true,
      total: true,
      clientName: true,
      client: { select: { name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
    ...(offset !== null ? { skip: offset } : {}),
    ...(limit !== null ? { take: limit + 1 } : {}),
  });

  if (offset === null && limit === null) {
    return NextResponse.json({ invoices });
  }

  const resolvedLimit = limit ?? DEFAULT_LIMIT;
  const hasMore = invoices.length > resolvedLimit;
  const paginatedInvoices = hasMore
    ? invoices.slice(0, resolvedLimit)
    : invoices;

  return NextResponse.json({ invoices: paginatedInvoices, hasMore });
}
