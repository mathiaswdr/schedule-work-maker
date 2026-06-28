import { prisma } from "@/server/prisma";
import ExpensesClient from "@/components/dashboard/expenses-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

export default async function DashboardExpensesPage() {
  const { userId, userPlan, currency } = await getDashboardViewer();

  const initialExpenses = await prisma.expense.findMany({
    where: { userId },
    include: {
      invoices: {
        select: {
          id: true,
          amount: true,
          billedAt: true,
        },
        orderBy: [{ billedAt: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="expenses">
      <ExpensesClient
        displayClassName="font-sans tracking-tight"
        userPlan={userPlan}
        currency={currency}
        initialExpenses={serializeForClient(initialExpenses)}
      />
    </PlanGate>
  );
}
