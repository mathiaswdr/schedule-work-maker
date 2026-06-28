import { prisma } from "@/server/prisma";
import ClientsClient from "@/components/dashboard/clients-client";
import { checkClientLimit } from "@/lib/plan-limits";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

export default async function DashboardClientsPage() {
  const { userId, userPlan, currency } = await getDashboardViewer();
  const clientLimit = await checkClientLimit(userId, userPlan);

  const initialClients = await prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { projects: true, workSessions: true } },
    },
  });

  return (
    <ClientsClient
      displayClassName="font-sans tracking-tight"
      currency={currency}
      userPlan={userPlan}
      clientLimit={clientLimit}
      initialClients={serializeForClient(initialClients)}
    />
  );
}
