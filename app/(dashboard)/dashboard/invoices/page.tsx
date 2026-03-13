import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import InvoicesClient from "@/components/dashboard/invoices-client";
import { type PlanId } from "@/lib/plans";
import { checkInvoiceMonthlyLimit } from "@/lib/plan-limits";
import { getSessionUserId } from "@/server/work-sessions";
import { serializeForClient } from "@/lib/utils";

const INITIAL_INVOICES_PAGE_SIZE = 24;

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardInvoicesPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const userId = await getSessionUserId();

  const invoiceLimit = session
    ? await checkInvoiceMonthlyLimit(session.user.id, userPlan)
    : { allowed: true, current: 0, max: null };

  const initialInvoices = await prisma.invoice.findMany({
    where: { userId },
    select: {
      id: true,
      number: true,
      displayNumber: true,
      status: true,
      source: true,
      clientId: true,
      projectId: true,
      fileUrl: true,
      issueDate: true,
      total: true,
      clientName: true,
      client: { select: { name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
    take: INITIAL_INVOICES_PAGE_SIZE + 1,
  });
  const hasMoreInitialInvoices =
    initialInvoices.length > INITIAL_INVOICES_PAGE_SIZE;
  const paginatedInitialInvoices = hasMoreInitialInvoices
    ? initialInvoices.slice(0, INITIAL_INVOICES_PAGE_SIZE)
    : initialInvoices;

  return (
    <InvoicesClient
      displayClassName={display.className}
      userPlan={userPlan}
      invoiceLimit={invoiceLimit}
      initialInvoices={serializeForClient(paginatedInitialInvoices)}
      initialHasMore={hasMoreInitialInvoices}
    />
  );
}
