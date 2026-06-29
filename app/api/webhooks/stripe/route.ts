import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/server/stripe";
import { prisma } from "@/server/prisma";
import { sendPaidStripeInvoiceEmail } from "@/server/stripe-invoice-email";
import { getPlanByStripePrice, isPlanId, normalizePlanId } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

const STRIPE_SUBSCRIPTION_STATUSES_TO_CANCEL = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

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

      const metadataPlanId = session.metadata?.planId;
      const planId = isPlanId(metadataPlanId) ? normalizePlanId(metadataPlanId) : "PRO";
      await updateUserPlanPreservingLifetime(user, planId);
      if (planId === "LIFETIME") {
        await cancelBillableSubscriptions(session.customer);
      }
      console.log("Checkout session completed - plan set to", planId);
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
      await updateUserPlanPreservingLifetime(user, planId);
      try {
        await sendPaidStripeInvoiceEmail({
          invoice,
          fallbackEmail: user.email,
          fallbackName: user.name,
        });
      } catch (error) {
        console.error("Invoice paid email failed:", error);
      }
      console.log("Invoice paid - plan set to", planId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const user = await findUserFromCustomerId(invoice.customer);
      if (!user?.id) break;

      await downgradeUserToFreePreservingLifetime(user);
      console.log("Invoice payment failed - plan set to FREE");
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await findUserFromCustomerId(subscription.customer);
      if (!user?.id) break;

      await downgradeUserToFreePreservingLifetime(user);
      console.log("Subscription deleted - plan set to FREE");
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
    select: { id: true, plan: true, email: true, name: true },
  });
};

type StripeUser = NonNullable<Awaited<ReturnType<typeof findUserFromCustomerId>>>;

async function updateUserPlanPreservingLifetime(user: StripeUser, nextPlan: PlanId) {
  if (user.plan === "LIFETIME" && nextPlan !== "LIFETIME") {
    console.log("Lifetime plan preserved - ignored downgrade to", nextPlan);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: nextPlan },
  });
}

async function downgradeUserToFreePreservingLifetime(user: StripeUser) {
  if (user.plan === "LIFETIME") {
    console.log("Lifetime plan preserved - ignored subscription downgrade");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "FREE" },
  });
}

async function cancelBillableSubscriptions(stripeCustomerId: unknown) {
  if (typeof stripeCustomerId !== "string") {
    return;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 100,
  });

  await Promise.all(
    subscriptions.data
      .filter((subscription) =>
        STRIPE_SUBSCRIPTION_STATUSES_TO_CANCEL.has(subscription.status)
      )
      .map((subscription) => stripe.subscriptions.cancel(subscription.id))
  );
}
