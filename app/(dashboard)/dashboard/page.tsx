import { DM_Serif_Display } from "next/font/google";
import TimeTrackingClient from "@/components/dashboard/time-tracking-client";
import {
  getActiveSession,
  getRecentSessions,
  getWorkSummary,
} from "@/server/work-sessions";
import { prisma } from "@/server/prisma";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

export default async function DashboardPage() {
  const { userId, hourlyRate } = await getDashboardViewer();

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
      defaultHourlyRate={hourlyRate}
      initialData={serializeForClient({ session, summary, recentSessions })}
      initialClients={serializeForClient(clients)}
      initialProjects={serializeForClient(projects)}
    />
  );
}
