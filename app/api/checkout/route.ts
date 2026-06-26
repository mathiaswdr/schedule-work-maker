// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { stripe } from "@/server/stripe";
import { z } from "zod";
import {
  getStripePriceId,
  canUpgrade,
  normalizePlanId,
  PLANS,
  type PlanId,
  type BillingPeriod,
} from "@/lib/plans";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/checkout-intent";

const CheckoutBody = z.object({
  plan: z.enum(["STARTER", "PRO", "LIFETIME"]),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
});

const isResourceMissingError = (error: unknown): error is { code: string } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string" &&
  error.code === "resource_missing";

export async function POST(req: NextRequest) {
  try {
    const authSession = await auth();

    if (!authSession?.user?.id) {
      return NextResponse.json({
        message: "You need to be authenticated.",
        success: false,
      }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CheckoutBody.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid plan.", success: false }, { status: 400 });
    }

    const targetPlan = normalizePlanId(parsed.data.plan) as PlanId;
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

    if (!user) {
      return NextResponse.json({ message: "No user found.", success: false }, { status: 404 });
    }

    if (!canUpgrade(user.plan, targetPlan)) {
      return NextResponse.json({ message: "You cannot upgrade to this plan.", success: false }, { status: 400 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      stripeCustomerId = await createStripeCustomer(authSession.user.id, user.email, user.name);
    }

    const priceId = getStripePriceId(targetPlan, billing);
    if (!priceId) {
      return NextResponse.json({ message: "Price not configured.", success: false }, { status: 500 });
    }

    const planDefinition = PLANS.find((plan) => plan.id === targetPlan);
    const isLifetime = planDefinition?.billingType === "lifetime";

    let session;
    try {
      session = await createCheckoutSession({
        customer: stripeCustomerId,
        priceId,
        targetPlan,
        isLifetime,
      });
    } catch (stripeError: unknown) {
      if (isResourceMissingError(stripeError)) {
        stripeCustomerId = await createStripeCustomer(authSession.user.id, user.email, user.name);

        session = await createCheckoutSession({
          customer: stripeCustomerId,
          priceId,
          targetPlan,
          isLifetime,
        });
      } else {
        throw stripeError;
      }
    }

    if (!session.url) {
      return NextResponse.json({ message: "An error occurred.", success: false }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      success: true,
      message: "Redirecting to Stripe checkout.",
    });

  } catch (error) {
    console.error("Error creating Stripe session:", error);
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

function createCheckoutSession({
  customer,
  priceId,
  targetPlan,
  isLifetime,
}: {
  customer: string;
  priceId: string;
  targetPlan: PlanId;
  isLifetime: boolean;
}) {
  return stripe.checkout.sessions.create({
    customer,
    mode: isLifetime ? "payment" : "subscription",
    payment_method_types: ["card", "link"],
    billing_address_collection: "auto",
    customer_update: {
      address: "auto",
      name: "auto",
    },
    tax_id_collection: {
      enabled: true,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    ...(isLifetime
      ? {}
      : {
          subscription_data: {
            trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
          },
        }),
    metadata: { planId: targetPlan },
    success_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL!}/dashboard/subscription`,
  });
}
