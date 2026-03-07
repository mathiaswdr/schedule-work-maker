// app/api/payment-dashboard/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { stripe } from "@/server/stripe";

export async function POST() {
  try {
    const authSession = await auth();

    if (!authSession?.user.id) {
      return NextResponse.json({ message: "User not authenticated", success: false }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: {
        stripeCustomerId: true,
        plan: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: "No user found", success: false }, { status: 200 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      stripeCustomerId = await createStripeCustomer(authSession.user.id, user.email, user.name);
    }

    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription`,
      });
    } catch (stripeError: any) {
      if (stripeError?.code === "resource_missing") {
        stripeCustomerId = await createStripeCustomer(authSession.user.id, user.email, user.name);

        session = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription`,
        });
      } else {
        throw stripeError;
      }
    }

    if (!session.url) {
      return NextResponse.json({ message: "Failed to create Stripe session", success: false }, { status: 200 });
    }

    return NextResponse.json({ url: session.url, success: true, message: "Redirecting to Stripe Billing Portal" }, { status: 200 });

  } catch (error) {
    console.error("Error creating Stripe Billing Portal session:", error);
    return NextResponse.json({ message: "Internal server error", success: false }, { status: 500 });
  }
}

async function createStripeCustomer(userId: string, email: string, name: string | null): Promise<string> {
  const stripeCustomer = await stripe.customers.create({
    email,
    name: name ?? undefined,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: stripeCustomer.id },
  });

  return stripeCustomer.id;
}