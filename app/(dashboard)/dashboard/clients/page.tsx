import { DM_Serif_Display } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import ClientsClient from "@/components/dashboard/clients-client";
import { type PlanId } from "@/lib/plans";
import { checkClientLimit } from "@/lib/plan-limits";
import { getSessionUserId } from "@/server/work-sessions";
import { serializeForClient } from "@/lib/utils";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function DashboardClientsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const userId = await getSessionUserId();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true },
      })
    : null;

  const clientLimit = session
    ? await checkClientLimit(session.user.id, userPlan)
    : { allowed: true, current: 0, max: null };

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
      currency={user?.currency ?? "CHF"}
      userPlan={userPlan}
      clientLimit={clientLimit}
      initialClients={serializeForClient(initialClients)}
    />
  );
}
