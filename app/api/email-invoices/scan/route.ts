import { NextResponse } from "next/server";

import { isEmailInvoiceImportEnabled } from "@/lib/feature-flags";
import { isPlanSufficient } from "@/lib/plans";
import { withAuthenticatedRoute } from "@/server/auth-helpers";
import { prisma } from "@/server/prisma";
import { scanGmailInvoices } from "@/server/email-invoice-import";

export async function POST() {
  if (!isEmailInvoiceImportEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return withAuthenticatedRoute(async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!isPlanSufficient(user?.plan ?? "FREE", "PRO")) {
      return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
    }

    const result = await scanGmailInvoices(userId);

    return NextResponse.json(result);
  });
}
