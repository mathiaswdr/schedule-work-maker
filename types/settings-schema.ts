import { z } from "zod"

export const SettingsSchema = z.object({
    name: z.optional(z.string()),
    image: z.optional(z.string()),
    email: z.optional(z.string().email()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    currency: z.optional(z.string().max(3)),
    hourlyRate: z.optional(z.number().min(0)),
    password: z.optional(z.string().min(8)),
    newPassword: z.optional(z.string().min(8))
    
})