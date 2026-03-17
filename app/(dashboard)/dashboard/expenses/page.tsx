import { DM_Serif_Display } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import ExpensesClient from "@/components/dashboard/expenses-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { type PlanId } from "@/lib/plans";
import { getSessionUserId } from "@/server/work-sessions";
import { serializeForClient } from "@/lib/utils";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function DashboardExpensesPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const userId = await getSessionUserId();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true },
      })
    : null;

  const initialExpenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="expenses">
      <ExpensesClient
        displayClassName={display.className}
        currency={user?.currency ?? "CHF"}
        initialExpenses={serializeForClient(initialExpenses)}
      />
    </PlanGate>
  );
}
