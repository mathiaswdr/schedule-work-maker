import TimeTrackingClient from "@/components/dashboard/time-tracking-client";
import {
  getActiveSession,
  getRecentSessions,
  getWorkSummary,
} from "@/server/work-sessions";
import { prisma } from "@/server/prisma";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

export default async function DashboardPage() {
  const { userId, hourlyRate, currency } = await getDashboardViewer();

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
      displayClassName="font-sans tracking-tight"
      defaultHourlyRate={hourlyRate}
      currency={currency}
      initialData={serializeForClient({ session, summary, recentSessions })}
      initialClients={serializeForClient(clients)}
      initialProjects={serializeForClient(projects)}
    />
  );
}
