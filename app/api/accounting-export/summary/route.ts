import { NextResponse } from "next/server";

import {
  getAccountingExportSummary,
  parseAccountingExportPeriod,
} from "@/server/accounting-export";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { isPlanSufficient, normalizePlanId } from "@/lib/plans";

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
    const period = parseAccountingExportPeriod(new URL(request.url).searchParams);
    const summary = await getAccountingExportSummary(session.user.id, period);

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }
}
