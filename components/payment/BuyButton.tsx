import { auth } from "@/server/auth";
import { Button } from "../ui/button";
import { prisma } from "@/server/prisma";
import { stripe } from "@/server/stripe";
import { redirect } from "next/navigation";


export default function BuyButton(){

    return(
        <form >
            <button className="" formAction={async () => {
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

                if(user.plan === "PRO") throw new Error("User use already PRO version")

                const stripeCustomerId = user?.stripeCustomerId ?? undefined;

                
                if(!stripeCustomerId) throw new Error("No customer id on stripe")

                const session = await stripe.checkout.sessions.create({
                    customer: stripeCustomerId,
                    mode: "subscription",
                    payment_method_types: ["card", "link"],
                    line_items: [
                        {
                            price: process.env.NODE_ENV === "development" ? "price_1PzgdkDBFyrKF36o3SDd6tbb" : "",
                            quantity: 1,
                        }
                    ],
                    success_url: `${process.env.NEXT_PUBLIC_URL!}/success`,
                    cancel_url: `${process.env.NEXT_PUBLIC_URL!}`,

                })

                if(!session.url){
                    throw new Error("Session url is missing")
                }
                
                redirect(session.url);

            }}>
                Upgrade to master plan
            </button>
        </form>

    )
}