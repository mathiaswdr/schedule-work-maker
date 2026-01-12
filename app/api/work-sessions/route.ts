import { NextResponse } from "next/server";
import {
  getActiveSession,
  getSessionUserId,
  getWorkSummary,
  pauseOrStopSession,
  startOrResumeSession,
} from "@/server/work-sessions";

export async function GET() {
  const userId = await getSessionUserId();
  const session = await getActiveSession(userId);
  const summary = await getWorkSummary(userId);

  return NextResponse.json({ session, summary });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  const payload = await request.json().catch(() => ({}));
  const action = typeof payload?.action === "string" ? payload.action : "";
  const timezone = typeof payload?.timezone === "string" ? payload.timezone : undefined;

  if (action === "start") {
    await startOrResumeSession(userId, timezone);
  } else if (action === "stop") {
    await pauseOrStopSession(userId);
  }

  const session = await getActiveSession(userId);
  const summary = await getWorkSummary(userId);

  return NextResponse.json({ session, summary });
}
