import { NextResponse } from "next/server";

import { isEmailInvoiceImportEnabled } from "@/lib/feature-flags";
import { withAuthenticatedRoute } from "@/server/auth-helpers";
import { prisma } from "@/server/prisma";

export async function POST() {
  if (!isEmailInvoiceImportEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return withAuthenticatedRoute(async (userId) => {
    await prisma.emailConnection.deleteMany({
      where: { userId, provider: "GMAIL" },
    });

    return NextResponse.json({ success: true });
  });
}
