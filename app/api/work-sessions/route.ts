import { NextResponse } from "next/server";
import {
  endSession,
  getActiveSession,
  getRecentSessions,
  getWorkSummary,
  pauseSession,
  resumeSession,
  startSession,
  WorkSessionTransitionError,
} from "@/server/work-sessions";
import { withAuthenticatedRoute } from "@/server/auth-helpers";

export async function GET() {
  return withAuthenticatedRoute(async (userId) => {
    const [session, summary, recentSessions] = await Promise.all([
      getActiveSession(userId),
      getWorkSummary(userId),
      getRecentSessions(userId),
    ]);

    return NextResponse.json({ session, summary, recentSessions });
  });
}

export async function POST(request: Request) {
  return withAuthenticatedRoute(async (userId) => {
    const payload = await request.json().catch(() => ({}));
    const action = typeof payload?.action === "string" ? payload.action : "";
    const timezone =
      typeof payload?.timezone === "string" ? payload.timezone : undefined;
    const clientId =
      typeof payload?.clientId === "string" ? payload.clientId : undefined;
    const projectId =
      typeof payload?.projectId === "string" ? payload.projectId : undefined;

    try {
      if (action === "start") {
        await startSession(userId, timezone, clientId, projectId);
      } else if (action === "pause") {
        await pauseSession(userId);
      } else if (action === "resume") {
        await resumeSession(userId);
      } else if (action === "end") {
        await endSession(userId);
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    } catch (error) {
      if (error instanceof WorkSessionTransitionError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      throw error;
    }

    const [session, summary, recentSessions] = await Promise.all([
      getActiveSession(userId),
      getWorkSummary(userId),
      getRecentSessions(userId),
    ]);

    return NextResponse.json({ session, summary, recentSessions });
  });
}
