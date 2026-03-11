import { Fraunces } from "next/font/google";
import TimeTrackingClient from "@/components/dashboard/time-tracking-client";
import {
  getActiveSession,
  getRecentSessions,
  getSessionUserId,
  getWorkSummary,
} from "@/server/work-sessions";
import { prisma } from "@/server/prisma";
import { serializeForClient } from "@/lib/utils";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default async function DashboardPage() {
  const userId = await getSessionUserId();

  const [session, summary, recentSessions, clients, projects] = await Promise.all([
    getActiveSession(userId),
    getWorkSummary(userId),
    getRecentSessions(userId),
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        client: { select: { id: true, name: true, color: true } },
      },
    }),
  ]);

  return (
    <TimeTrackingClient
      displayClassName={display.className}
      initialData={serializeForClient({ session, summary, recentSessions })}
      initialClients={serializeForClient(clients)}
      initialProjects={serializeForClient(projects)}
    />
  );
}
