'use client'

import { useCartStore } from "@/lib/client-store"
import { AddressElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { useState } from "react"

import { createPaymentIntent } from "@/server/actions/create-payment-intent"


export default function PaymentForm({price}:{price:number}){
    
    const stripe = useStripe()
    const elements = useElements()
    const {cart} = useCartStore()

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        if(!stripe || !elements){
            setIsLoading(false)
            return
        }

        const {error: submitError} = await elements.submit();
        if(submitError){
            setErrorMessage(submitError.message!)
            setIsLoading(false)
            return
        }

        // const {success} = await createPaymentIntent({
        //     amount: price,
        //     currency: 'usd',
        //     product: {
        //         price: price,
        //         productID: "",
        //     },
        // })

        // if(data?.error){
        //     setErrorMessage(data.error)
        //     setIsLoading(false)

        //     return
        // }

    }

    return (
        <form className="flex flex-col justify-center items-center" onSubmit={handleSubmit}>
            <PaymentElement />
            <AddressElement options={{mode: "billing"}} />
            <Button className="mt-10 mx-auto w-44" disabled={!stripe || !elements}>
                <span>
                    Pay now
                </span>
            </Button>

        </form>
    )
}