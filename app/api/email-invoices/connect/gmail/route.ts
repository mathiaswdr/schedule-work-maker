import { NextResponse } from "next/server";

import { isEmailInvoiceImportEnabled } from "@/lib/feature-flags";
import { isPlanSufficient } from "@/lib/plans";
import { buildGmailOAuthUrl } from "@/server/email-invoice-import";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!isEmailInvoiceImportEnabled()) {
    return NextResponse.redirect(new URL("/dashboard/expenses", origin));
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!isPlanSufficient(user?.plan ?? "FREE", "PRO")) {
    return NextResponse.redirect(
      new URL("/dashboard/expenses/email-invoices?upgrade=1", origin)
    );
  }

  return NextResponse.redirect(buildGmailOAuthUrl(userId, origin));
}
