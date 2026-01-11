// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { stripe } from "@/server/stripe";

export async function POST() {
  try {
    // Authentifier l'utilisateur
    const authSession = await auth();

    // if (!authSession?.user.id) {
    //   return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    // }

    if (!authSession?.user.id) {
      return NextResponse.json({
        message: "You need to be authenticated...",
        // redirect: `${process.env.NEXT_PUBLIC_URL}/auth/login`,
        success: false,
      }, { status: 200 });
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: {
        stripeCustomerId: true,
        plan: true,
      }
    });

    
    if (!user) return NextResponse.json({message: "No user found.", success: false}, { status: 200 });
    if (user.plan === "PRO") return NextResponse.json({message: "You are already in PRO version.", success: false}, { status: 200 });


    const stripeCustomerId = user.stripeCustomerId ?? undefined;
    if (!stripeCustomerId) return NextResponse.json({message: "An error occured.", success: false}, { status: 200 });

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card", "link"],
      line_items: [
        {
          price: process.env.NODE_ENV === "development" ? "price_1PzgdkDBFyrKF36o3SDd6tbb" : "", // À ajuster en production
          quantity: 1,
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL!}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL!}`,
    });

    // if (!session.url) return NextResponse.json({ error: "Session URL is missing" }, { status: 500 });
    if (!session.url) return NextResponse.json({message: "An error occured.", success: false}, { status: 200 });

    // Rediriger vers l'URL Stripe
    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error) {
    console.error("Error creating Stripe session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}