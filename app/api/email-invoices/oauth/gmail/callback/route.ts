import { NextResponse } from "next/server";

import { encryptToken, verifyEmailOAuthState } from "@/lib/email-token-crypto";
import { isEmailInvoiceImportEnabled } from "@/lib/feature-flags";
import {
  exchangeGmailCode,
  getGmailProfile,
} from "@/server/email-invoice-import";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  if (!isEmailInvoiceImportEnabled()) {
    return NextResponse.redirect(new URL("/dashboard/expenses", origin));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const payload = state ? verifyEmailOAuthState(state) : null;
  const session = await auth();
  const userId = session?.user?.id;
  const destination = new URL("/dashboard/expenses/email-invoices", origin);

  if (!code || !payload || !userId || payload.userId !== userId) {
    destination.searchParams.set("error", "oauth");
    return NextResponse.redirect(destination);
  }

  try {
    const tokenPayload = await exchangeGmailCode(code, origin);
    const profile = await getGmailProfile(tokenPayload.access_token);
    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000)
      : null;
    const existing = await prisma.emailConnection.findUnique({
      where: {
        userId_provider_email: {
          userId,
          provider: "GMAIL",
          email: profile.email,
        },
      },
      select: { refreshToken: true },
    });

    await prisma.emailConnection.upsert({
      where: {
        userId_provider_email: {
          userId,
          provider: "GMAIL",
          email: profile.email,
        },
      },
      create: {
        userId,
        provider: "GMAIL",
        email: profile.email,
        accessToken: encryptToken(tokenPayload.access_token),
        refreshToken: tokenPayload.refresh_token
          ? encryptToken(tokenPayload.refresh_token)
          : null,
        expiresAt,
        scope: tokenPayload.scope,
      },
      update: {
        accessToken: encryptToken(tokenPayload.access_token),
        refreshToken: tokenPayload.refresh_token
          ? encryptToken(tokenPayload.refresh_token)
          : existing?.refreshToken ?? null,
        expiresAt,
        scope: tokenPayload.scope,
      },
    });

    destination.searchParams.set("connected", "1");
  } catch {
    destination.searchParams.set("error", "oauth");
  }

  return NextResponse.redirect(destination);
}
