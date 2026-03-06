import { z } from "zod"

export const WorkSessionUpdateSchema = z.object({
  sessionId: z.string().cuid(),
  clientId: z.string().cuid().optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  startedAt: z.string().datetime({ offset: true }).optional().nullable(),
  endedAt: z.string().datetime({ offset: true }).optional().nullable(),
})

export const WorkSessionDeleteSchema = z.object({
  sessionId: z.string().cuid(),
})
