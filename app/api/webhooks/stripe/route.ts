import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/server/stripe";
import { prisma } from "@/server/prisma";
import { getPlanByStripePrice } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const user = await findUserFromCustomerId(session.customer);
      if (!user?.id) break;

      const planId = (session.metadata?.planId as PlanId) || "PRO";
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: planId },
      });
      console.log("Checkout session completed — plan set to", planId);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const user = await findUserFromCustomerId(invoice.customer);
      if (!user?.id) break;

      let planId: PlanId = "PRO";
      const lineItem = invoice.lines?.data?.[0];
      const priceRef = lineItem?.pricing?.price_details?.price;
      const priceId =
        typeof priceRef === "string" ? priceRef : priceRef?.id;
      if (priceId) {
        planId = getPlanByStripePrice(priceId);
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: planId },
      });
      console.log("Invoice paid — plan set to", planId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const user = await findUserFromCustomerId(invoice.customer);
      if (!user?.id) break;

      await prisma.user.update({
        where: { id: user.id },
        data: { plan: "FREE" },
      });
      console.log("Invoice payment failed — plan set to FREE");
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await findUserFromCustomerId(subscription.customer);
      if (!user?.id) break;

      await prisma.user.update({
        where: { id: user.id },
        data: { plan: "FREE" },
      });
      console.log("Subscription deleted — plan set to FREE");
      break;
    }

    default:
      console.log("Unhandled event type:", event.type);
      break;
  }

  return NextResponse.json({ ok: true });
}

const findUserFromCustomerId = async (stripeCustomerId: unknown) => {
  if (typeof stripeCustomerId !== "string") {
    return null;
  }
  return prisma.user.findFirst({
    where: { stripeCustomerId },
  });
};
