import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import SessionsClient from "@/components/dashboard/sessions-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { type PlanId } from "@/lib/plans";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardSessionsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true, hourlyRate: true },
      })
    : null;

  return (
    <PlanGate userPlan={userPlan} requiredPlan="STARTER" feature="sessions">
      <SessionsClient
        displayClassName={display.className}
        currency={user?.currency ?? "CHF"}
        hourlyRate={user?.hourlyRate ?? 0}
      />
    </PlanGate>
  );
}
