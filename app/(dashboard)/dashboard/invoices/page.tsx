import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import InvoicesClient from "@/components/dashboard/invoices-client";
import { type PlanId } from "@/lib/plans";
import { checkInvoiceMonthlyLimit } from "@/lib/plan-limits";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardInvoicesPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;

  const invoiceLimit = session
    ? await checkInvoiceMonthlyLimit(session.user.id, userPlan)
    : { allowed: true, current: 0, max: null };

  return (
    <InvoicesClient
      displayClassName={display.className}
      userPlan={userPlan}
      invoiceLimit={invoiceLimit}
    />
  );
}
