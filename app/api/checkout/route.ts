// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { stripe } from "@/server/stripe";
import { z } from "zod";
import { getStripePriceId, canUpgrade, type PlanId, type BillingPeriod } from "@/lib/plans";

const CheckoutBody = z.object({
  plan: z.enum(["STARTER", "PRO"]),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  try {
    const authSession = await auth();

    if (!authSession?.user.id) {
      return NextResponse.json({
        message: "You need to be authenticated...",
        success: false,
      }, { status: 200 });
    }

    const body = await req.json();
    const parsed = CheckoutBody.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid plan.", success: false }, { status: 200 });
    }

    const targetPlan = parsed.data.plan as PlanId;
    const billing = parsed.data.billing as BillingPeriod;

    const user = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: {
        stripeCustomerId: true,
        plan: true,
        email: true,
        name: true,
      }
    });

    if (!user) return NextResponse.json({ message: "No user found.", success: false }, { status: 200 });

    if (!canUpgrade(user.plan, targetPlan)) {
      return NextResponse.json({ message: "You cannot upgrade to this plan.", success: false }, { status: 200 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      stripeCustomerId = await createStripeCustomer(authSession.user.id, user.email, user.name);
    }

    const priceId = getStripePriceId(targetPlan, billing);
    if (!priceId) return NextResponse.json({ message: "Price not configured.", success: false }, { status: 200 });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "subscription",
        payment_method_types: ["card", "link"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          }
        ],
        metadata: { planId: targetPlan },
        success_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription`,
      });
    } catch (stripeError: any) {
      if (stripeError?.code === "resource_missing") {
        stripeCustomerId = await createStripeCustomer(authSession.user.id, user.email, user.name);

        session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          mode: "subscription",
          payment_method_types: ["card", "link"],
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: { planId: targetPlan },
          success_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription`,
        });
      } else {
        throw stripeError;
      }
    }

    if (!session.url) return NextResponse.json({ message: "An error occured.", success: false }, { status: 200 });

    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error) {
    console.error("Error creating Stripe session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
