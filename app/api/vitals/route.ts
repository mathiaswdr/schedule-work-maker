import { NextResponse } from "next/server";
import type { VitalsPayload } from "@/types/vitals";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<VitalsPayload>;

  if (
    typeof payload.metric !== "string" ||
    typeof payload.value !== "number" ||
    typeof payload.pathname !== "string"
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.info("[vitals]", JSON.stringify(payload));

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
