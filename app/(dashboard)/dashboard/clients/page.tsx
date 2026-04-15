import { DM_Serif_Display } from "next/font/google";
import { prisma } from "@/server/prisma";
import ClientsClient from "@/components/dashboard/clients-client";
import { checkClientLimit } from "@/lib/plan-limits";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

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
      displayClassName={display.className}
      currency={currency}
      userPlan={userPlan}
      clientLimit={clientLimit}
      initialClients={serializeForClient(initialClients)}
    />
  );
}
