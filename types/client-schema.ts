import { z } from "zod"

export const ClientSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  postalCode: z.string().max(20).optional(),
  city: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  color: z.string().max(7).optional(),
  notes: z.string().max(500).optional(),
})

export const ClientUpdateSchema = ClientSchema.extend({
  id: z.string().cuid(),
})

export const ClientDeleteSchema = z.object({
  id: z.string().cuid(),
})
