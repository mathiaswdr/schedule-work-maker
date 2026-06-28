import SubscriptionClient from "@/components/dashboard/subscription-client";
import { getDashboardViewer } from "@/server/dashboard-viewer";

export default async function SubscriptionPage() {
  const { userPlan, stripeCustomerId } = await getDashboardViewer();

  return (
    <SubscriptionClient
      plan={userPlan}
      hasStripeCustomer={!!stripeCustomerId}
      displayClassName="font-sans tracking-tight"
    />
  );
}
