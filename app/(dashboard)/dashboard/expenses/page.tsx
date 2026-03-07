import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import ExpensesClient from "@/components/dashboard/expenses-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardExpensesPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true },
      })
    : null;

  return (
    <ExpensesClient
      displayClassName={display.className}
      currency={user?.currency ?? "CHF"}
    />
  );
}
