import { Suspense } from "react";
import { DM_Serif_Display } from "next/font/google";
import { prisma } from "@/server/prisma";
import DashboardPageFallback from "@/components/dashboard/dashboard-page-fallback";
import { getDashboardViewer } from "@/server/dashboard-viewer";
import SettingsCard from "./settings-card";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
});

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
      displayClassName={display.className}
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
