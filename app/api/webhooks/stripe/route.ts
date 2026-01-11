import { prisma } from "@/server/prisma";
import { ok } from "assert";
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const POST = async (req:NextRequest) => {
    const body = await req.json() as Stripe.Event;


    switch (body.type) {
        case "checkout.session.completed": {
            const session = body.data.object as Stripe.Checkout.Session;
            const stripeCustomerId = session.customer;
            const user = await findUserFromCustomerId(stripeCustomerId);
            
            if(!user?.id) break; 

            await prisma.user.update({
                where: {id: user?.id},
                data: {plan: "PRO"}
            })
            console.log("Checkout session completed", session)
            break;
        }
        case "invoice.paid": {
            const invoice = body.data.object as Stripe.Invoice

            const stripeCustomerId = invoice.customer;
            const user = await findUserFromCustomerId(stripeCustomerId);
            
            if(!user?.id) break; 

            await prisma.user.update({
                where: {id: user?.id},
                data: {plan: "PRO"}
            })
            console.log("Invoice paid", body.type, invoice)

            break;
        }

        case "invoice.payment_failed":{
            const invoice = body.data.object as Stripe.Invoice

            const stripeCustomerId = invoice.customer;
            const user = await findUserFromCustomerId(stripeCustomerId);
            
            if(!user?.id) break; 

            await prisma.user.update({
                where: {id: user?.id},
                data: {plan: "FREE"}
            })
            console.log("Invoice payment failed", body.type, invoice)

            break;
        }

        case "customer.subscription.deleted":{
            const subcription = body.data.object as Stripe.Subscription
            const stripeCustomerId = subcription.customer;
            const user = await findUserFromCustomerId(stripeCustomerId);
            
            if(!user?.id) break; 

            await prisma.user.update({
                where: {id: user?.id},
                data: {plan: "FREE"}
            })
            console.log("subcription event", body.type, subcription)
            break;
        }

        default:
            console.log("Unhandled event type", body.type)
            break;
    }

    return NextResponse.json({
        ok: true,
    })
}




export const findUserFromCustomerId = async (stripeCustomerId: unknown) => {

    if(typeof stripeCustomerId !== "string"){
        return null;
    }

    return prisma.user.findFirst({
        where: {stripeCustomerId}
    })
}