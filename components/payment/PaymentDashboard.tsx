import { auth } from "@/server/auth";
import { Button } from "../ui/button";
import { prisma } from "@/server/prisma";
import { stripe } from "@/server/stripe";
import { redirect } from "next/navigation";


export default function PaymentDashboard(){

    return(
        <form >
            <Button formAction={async () => {
                "use server"

                const authSession = await auth()

                const user = await prisma.user.findUnique({
                    where: {
                        id: authSession?.user.id ?? "",
                    },
                    select: {
                        stripeCustomerId: true,
                        plan: true,
                    }
                })

                if(!user) throw new Error("No user found");

                const stripeCustomerId = user?.stripeCustomerId ?? undefined;
                
                if(!stripeCustomerId) throw new Error("No customer id on stripe")

                const session = await stripe.billingPortal.sessions.create({
                    customer: user.stripeCustomerId ?? "",
                    return_url: process.env.NEXT_PUBLIC_URL!,
                })

                if(!session.url){
                    throw new Error("Session url is missing")
                }
                
                redirect(session.url);

            }}>
                Manage subscription
            </Button>
        </form>

    )
}