import { z } from "zod"

export const ProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  clientId: z.string().cuid().optional().nullable(),
  serviceTypeId: z.string().cuid().optional().nullable(),
})

export const ProjectUpdateSchema = ProjectSchema.extend({
  id: z.string().cuid(),
})

export const ProjectDeleteSchema = z.object({
  id: z.string().cuid(),
})
