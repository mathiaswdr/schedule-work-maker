import { DM_Serif_Display } from "next/font/google";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import SubscriptionClient from "@/components/dashboard/subscription-client";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, stripeCustomerId: true },
  });

  return (
    <SubscriptionClient
      plan={user?.plan ?? "FREE"}
      hasStripeCustomer={!!user?.stripeCustomerId}
      displayClassName={display.className}
    />
  );
}
