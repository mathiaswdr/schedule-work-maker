import { DM_Serif_Display } from "next/font/google";
import SubscriptionClient from "@/components/dashboard/subscription-client";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function SubscriptionPage() {
  const { userPlan, stripeCustomerId } = await getDashboardViewer();

  return (
    <SubscriptionClient
      plan={userPlan}
      hasStripeCustomer={!!stripeCustomerId}
      displayClassName={display.className}
    />
  );
}
