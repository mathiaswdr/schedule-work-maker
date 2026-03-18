import { NextResponse } from "next/server";

import { getMagicLink, isMagicLinkCaptureEnabled } from "@/server/e2e-auth";

export async function GET(request: Request) {
  if (!isMagicLinkCaptureEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "The email query parameter is required." },
      { status: 400 }
    );
  }

  const url = getMagicLink(email);

  if (!url) {
    return NextResponse.json(
      { error: "Magic link not ready yet." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { url },
    { headers: { "Cache-Control": "no-store" } }
  );
}
