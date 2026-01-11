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
      }
    });

    if (!user) {
      return NextResponse.json({ message: "No user found", success: false }, { status: 200 });
    }

    const stripeCustomerId = user.stripeCustomerId ?? undefined;
    if (!stripeCustomerId) {
      return NextResponse.json({ message: "No customer ID found on Stripe", success: false }, { status: 200 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_URL!}`,
    });

    // console.log("session :", session)

    if (!session.url) {
      return NextResponse.json({ message: "Failed to create Stripe session", success: false }, { status: 200 });
    }

    return NextResponse.json({ url: session.url, success: true, message: "Redirecting to Stripe Billing Portal" }, { status: 200 });

  } catch (error) {
    console.error("Error creating Stripe Billing Portal session:", error);
    return NextResponse.json({ message: "Internal server error", success: false }, { status: 500 });
  }
}