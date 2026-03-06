import { z } from "zod"

export const ServiceTypeSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().max(7).optional(),
})

export const ServiceTypeUpdateSchema = ServiceTypeSchema.extend({
  id: z.string().cuid(),
})

export const ServiceTypeDeleteSchema = z.object({
  id: z.string().cuid(),
})
