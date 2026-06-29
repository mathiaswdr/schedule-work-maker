import SubscriptionClient from "@/components/dashboard/subscription-client";
import { getDashboardViewer } from "@/server/dashboard-viewer";

export default async function SubscriptionPage() {
  const { userPlan, stripeCustomerId, currency } = await getDashboardViewer();

  return (
    <SubscriptionClient
      plan={userPlan}
      currency={currency}
      hasStripeCustomer={!!stripeCustomerId}
      displayClassName="font-sans tracking-tight"
    />
  );
}
