import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { withAuthenticatedRoute } from "@/server/auth-helpers";

const DEFAULT_LIMIT = 24;

export async function GET(request: Request) {
  return withAuthenticatedRoute(async (userId) => {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const offsetParam = searchParams.get("offset");
    const limitParam = searchParams.get("limit");
    const offset = offsetParam ? Math.max(Number(offsetParam), 0) : null;
    const limit = limitParam
      ? Math.min(Math.max(Number(limitParam), 1), 100)
      : null;

    const where: { userId: string; OR?: { clientId: string | null }[] } = { userId };
    if (clientId) {
      where.OR = [{ clientId }, { clientId: null }];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { name: "asc" },
      ...(offset !== null ? { skip: offset } : {}),
      ...(limit !== null ? { take: limit + 1 } : {}),
      include: {
        client: { select: { id: true, name: true, color: true } },
        serviceType: { select: { id: true, name: true, color: true } },
        _count: { select: { workSessions: true } },
      },
    });

    if (offset === null && limit === null) {
      return NextResponse.json({ projects });
    }

    const resolvedLimit = limit ?? DEFAULT_LIMIT;
    const hasMore = projects.length > resolvedLimit;
    const paginatedProjects = hasMore
      ? projects.slice(0, resolvedLimit)
      : projects;

    return NextResponse.json({ projects: paginatedProjects, hasMore });
  });
}
