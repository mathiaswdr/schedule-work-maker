'use server'


import { paymentIntentSchema } from "@/types/payment-intent-schema";
import { createSafeActionClient } from "next-safe-action";
import { Stripe } from "stripe";
import { auth } from "../auth";

const stripe = new Stripe(process.env.STRIPE_SECRET!)


const action = createSafeActionClient()

export const createPaymentIntent = action
  .schema(paymentIntentSchema)  // Vous devez appeler .schema()
  .action(async ({ parsedInput: values}) => {
    // const { values } = parsedInput;  // Récupérer les valeurs validées
    // Logique ici avec les valeurs

    const user = await auth()

    if(!user) return {error: "User not found"}
    if(!values.amount) return {error: "No Product to check"}

    const paymentIntent = await stripe.paymentIntents.create({
        amount: values.amount,
        currency: values.currency,
        payment_method_types: ['card'],
        automatic_payment_methods: {
            enabled: true
        },
        metadata: {
            product: JSON.stringify(values.product)
        }
    })

    console.log(paymentIntent)

    return {
        success: {
            paymentIntentID: paymentIntent.id,
            clientSecretID: paymentIntent.client_secret,
            user: user.user.email,
        }
    }

});