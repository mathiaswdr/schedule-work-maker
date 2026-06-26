import { DM_Serif_Display } from "next/font/google";
import { notFound } from "next/navigation";

import EmailInvoiceInboxClient from "@/components/dashboard/email-invoice-inbox-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { isEmailInvoiceImportEnabled } from "@/lib/feature-flags";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";
import { prisma } from "@/server/prisma";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function EmailInvoiceInboxPage() {
  if (!isEmailInvoiceImportEnabled()) {
    notFound();
  }

  const { userId, userPlan, currency } = await getDashboardViewer();

  const [connections, detectedInvoices] = await Promise.all([
    prisma.emailConnection.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.detectedInvoice.findMany({
      where: { userId },
      include: {
        emailConnection: {
          select: {
            provider: true,
            email: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { receivedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
  ]);

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="expenses">
      <EmailInvoiceInboxClient
        displayClassName={display.className}
        currency={currency}
        initialConnections={serializeForClient(connections)}
        initialDetectedInvoices={serializeForClient(detectedInvoices)}
      />
    </PlanGate>
  );
}
