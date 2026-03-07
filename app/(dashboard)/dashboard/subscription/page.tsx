import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import SubscriptionClient from "@/components/dashboard/subscription-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session) redirect("/");

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
