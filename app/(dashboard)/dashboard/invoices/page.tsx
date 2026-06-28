import { prisma } from "@/server/prisma";
import InvoicesClient from "@/components/dashboard/invoices-client";
import { checkInvoiceMonthlyLimit } from "@/lib/plan-limits";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const INITIAL_INVOICES_PAGE_SIZE = 24;

export default async function DashboardInvoicesPage() {
  const { userId, userPlan, currency } = await getDashboardViewer();
  const [invoiceLimit, businessProfile, initialInvoices] = await Promise.all([
    checkInvoiceMonthlyLimit(userId, userPlan),
    prisma.businessProfile.findUnique({
      where: { userId },
      select: { country: true },
    }),
    prisma.invoice.findMany({
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
    }),
  ]);
  const hasMoreInitialInvoices =
    initialInvoices.length > INITIAL_INVOICES_PAGE_SIZE;
  const paginatedInitialInvoices = hasMoreInitialInvoices
    ? initialInvoices.slice(0, INITIAL_INVOICES_PAGE_SIZE)
    : initialInvoices;

  return (
    <InvoicesClient
      displayClassName="font-sans tracking-tight"
      userPlan={userPlan}
      currency={currency}
      businessCountry={businessProfile?.country ?? null}
      invoiceLimit={invoiceLimit}
      initialInvoices={serializeForClient(paginatedInitialInvoices)}
      initialHasMore={hasMoreInitialInvoices}
    />
  );
}
