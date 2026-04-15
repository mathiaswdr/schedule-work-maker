import { notFound } from "next/navigation";
import { DM_Serif_Display } from "next/font/google";
import { prisma } from "@/server/prisma";
import ExpensesClient from "@/components/dashboard/expenses-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

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
        displayClassName={display.className}
        currency={currency}
        initialExpenseId={id}
        initialExpenseDetail={serializeForClient(expense)}
      />
    </PlanGate>
  );
}
