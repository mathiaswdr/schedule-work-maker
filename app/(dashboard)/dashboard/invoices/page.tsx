import { DM_Serif_Display } from "next/font/google";
import { prisma } from "@/server/prisma";
import InvoicesClient from "@/components/dashboard/invoices-client";
import { checkInvoiceMonthlyLimit } from "@/lib/plan-limits";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const INITIAL_INVOICES_PAGE_SIZE = 24;

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function DashboardInvoicesPage() {
  const { userId, userPlan } = await getDashboardViewer();
  const invoiceLimit = await checkInvoiceMonthlyLimit(userId, userPlan);

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
