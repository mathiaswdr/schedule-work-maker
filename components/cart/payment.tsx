'use client'

import { useCartStore } from "@/lib/client-store"
// import getStripe from "@/server/stripe"
import {Elements} from "@stripe/react-stripe-js"
import {motion} from "framer-motion"
import PaymentForm from "./payment-form"

// const stripe = getStripe()

export default function Payment(){

    const {cart} = useCartStore()

    let priceTest = 499

    return(
        <motion.div>
            {/* <Elements stripe={stripe} options={{
                mode: 'payment',
                currency: 'usd',
                amount: priceTest,
            }}>
                <PaymentForm price={priceTest}/>
            </Elements> */}
        </motion.div>
    )
}

