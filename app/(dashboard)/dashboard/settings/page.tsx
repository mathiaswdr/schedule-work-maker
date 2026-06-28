import { Suspense } from "react";
import { prisma } from "@/server/prisma";
import DashboardPageFallback from "@/components/dashboard/dashboard-page-fallback";
import { getDashboardViewer } from "@/server/dashboard-viewer";
import SettingsCard from "./settings-card";

async function SettingsContent() {
  const { session, currency, hourlyRate, userPlan, stripeCustomerId } =
    await getDashboardViewer();

  const [businessProfile, bankAccounts] = await Promise.all([
    prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <SettingsCard
      session={session}
      businessProfile={businessProfile}
      bankAccounts={bankAccounts}
      currency={currency}
      hourlyRate={hourlyRate}
      plan={userPlan}
      hasStripeCustomer={!!stripeCustomerId}
      displayClassName="font-sans tracking-tight"
    />
  );
}

export default function Settings() {
  return (
    <Suspense fallback={<DashboardPageFallback statsCards={4} sectionBlocks={3} />}>
      <SettingsContent />
    </Suspense>
  );
}
