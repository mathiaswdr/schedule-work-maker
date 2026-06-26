import { NextResponse } from "next/server";

import {
  buildAccountingExportZip,
  parseAccountingExportPeriod,
} from "@/server/accounting-export";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { isPlanSufficient, normalizePlanId } from "@/lib/plans";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!isPlanSufficient(normalizePlanId(user?.plan), "PRO")) {
    return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const period = parseAccountingExportPeriod(url.searchParams);
    const locale = url.searchParams.get("locale");
    const { buffer, filename } = await buildAccountingExportZip({
      userId: session.user.id,
      locale,
      period,
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate export" }, { status: 400 });
  }
}
