import * as z from "zod"


export const paymentIntentSchema = z.object({
    amount: z.number(),
    currency: z.string(),
    product: z.object({
        productID: z.string(),
        price: z.number()
    })
})