import { notFound } from "next/navigation";
import { prisma } from "@/server/prisma";
import ExpensesClient from "@/components/dashboard/expenses-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

export default async function DashboardExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId, userPlan, currency } = await getDashboardViewer();

  const expense = await prisma.expense.findFirst({
    where: { id, userId },
    include: {
      invoices: {
        orderBy: [{ billedAt: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!expense) {
    notFound();
  }

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="expenses">
      <ExpensesClient
        displayClassName="font-sans tracking-tight"
        userPlan={userPlan}
        currency={currency}
        initialExpenseId={id}
        initialExpenseDetail={serializeForClient(expense)}
      />
    </PlanGate>
  );
}
