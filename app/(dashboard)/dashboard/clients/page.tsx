import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import ClientsClient from "@/components/dashboard/clients-client";
import { type PlanId } from "@/lib/plans";
import { checkClientLimit } from "@/lib/plan-limits";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardClientsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true },
      })
    : null;

  const clientLimit = session
    ? await checkClientLimit(session.user.id, userPlan)
    : { allowed: true, current: 0, max: null };

  return (
    <ClientsClient
      displayClassName={display.className}
      currency={user?.currency ?? "CHF"}
      userPlan={userPlan}
      clientLimit={clientLimit}
    />
  );
}
