import { NextResponse } from "next/server";
import {
  getActiveSession,
  getRecentSessions,
  getSessionUserId,
  getWorkSummary,
  pauseOrStopSession,
  startOrResumeSession,
} from "@/server/work-sessions";

export async function GET() {
  const userId = await getSessionUserId();
  const [session, summary, recentSessions] = await Promise.all([
    getActiveSession(userId),
    getWorkSummary(userId),
    getRecentSessions(userId),
  ]);

  return NextResponse.json({ session, summary, recentSessions });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  const payload = await request.json().catch(() => ({}));
  const action = typeof payload?.action === "string" ? payload.action : "";
  const timezone = typeof payload?.timezone === "string" ? payload.timezone : undefined;
  const clientId = typeof payload?.clientId === "string" ? payload.clientId : undefined;
  const projectId = typeof payload?.projectId === "string" ? payload.projectId : undefined;

  if (action === "start") {
    await startOrResumeSession(userId, timezone, clientId, projectId);
  } else if (action === "stop") {
    await pauseOrStopSession(userId);
  }

  const [session, summary, recentSessions] = await Promise.all([
    getActiveSession(userId),
    getWorkSummary(userId),
    getRecentSessions(userId),
  ]);

  return NextResponse.json({ session, summary, recentSessions });
}
