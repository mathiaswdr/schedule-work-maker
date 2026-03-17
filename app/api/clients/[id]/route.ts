import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { withAuthenticatedRoute } from "@/server/auth-helpers";

const DEFAULT_SESSION_LIMIT = 20;
const DEFAULT_INVOICE_LIMIT = 20;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withAuthenticatedRoute(async (userId) => {
    const { searchParams } = new URL(request.url);
    const sessionOffset = Math.max(
      Number(searchParams.get("sessionOffset") ?? "0"),
      0
    );
    const invoiceOffset = Math.max(
      Number(searchParams.get("invoiceOffset") ?? "0"),
      0
    );
    const sessionLimit = Math.min(
      Math.max(
        Number(searchParams.get("sessionLimit") ?? String(DEFAULT_SESSION_LIMIT)),
        1
      ),
      100
    );
    const invoiceLimit = Math.min(
      Math.max(
        Number(searchParams.get("invoiceLimit") ?? String(DEFAULT_INVOICE_LIMIT)),
        1
      ),
      100
    );

    const client = await prisma.client.findFirst({
      where: { id: params.id, userId },
      select: {
        id: true,
        name: true,
        email: true,
        color: true,
        notes: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
        _count: { select: { projects: true, workSessions: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const [projects, recentSessions, recentInvoices] = await Promise.all([
      prisma.project.findMany({
        where: { clientId: params.id, userId },
        orderBy: { name: "asc" },
        include: {
          serviceType: { select: { id: true, name: true, color: true } },
          _count: { select: { workSessions: true } },
        },
      }),
      prisma.workSession.findMany({
        where: { clientId: params.id, userId },
        orderBy: { startedAt: "desc" },
        skip: sessionOffset,
        take: sessionLimit + 1,
        select: {
          id: true,
          status: true,
          startedAt: true,
          endedAt: true,
          project: { select: { id: true, name: true } },
          breaks: {
            select: {
              startedAt: true,
              endedAt: true,
            },
          },
        },
      }),
      prisma.invoice.findMany({
        where: { clientId: params.id, userId },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        skip: invoiceOffset,
        take: invoiceLimit + 1,
        select: {
          id: true,
          displayNumber: true,
          status: true,
          source: true,
          total: true,
          issueDate: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
      }),
    ]);
    const recentSessionsHasMore = recentSessions.length > sessionLimit;
    const recentInvoicesHasMore = recentInvoices.length > invoiceLimit;
    const paginatedSessions = recentSessionsHasMore
      ? recentSessions.slice(0, sessionLimit)
      : recentSessions;
    const paginatedInvoices = recentInvoicesHasMore
      ? recentInvoices.slice(0, invoiceLimit)
      : recentInvoices;

    return NextResponse.json({
      client,
      projects,
      recentSessions: paginatedSessions,
      recentInvoices: paginatedInvoices,
      hasMoreSessions: recentSessionsHasMore,
      hasMoreInvoices: recentInvoicesHasMore,
    });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.client.deleteMany({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
