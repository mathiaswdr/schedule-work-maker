'use server'

import { createSafeActionClient } from 'next-safe-action'
import { WorkSessionUpdateSchema, WorkSessionDeleteSchema } from '@/types/work-session-update-schema'
import { auth } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { revalidatePath } from 'next/cache'

const action = createSafeActionClient()

export const updateWorkSession = action
  .schema(WorkSessionUpdateSchema)
  .action(async ({ parsedInput: { sessionId, clientId, projectId, startedAt, endedAt } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const existing = await prisma.workSession.findUnique({
      where: { id: sessionId, userId: user.user.id },
      include: { breaks: { orderBy: { startedAt: "asc" } } },
    })
    if (!existing) return { error: "Session not found" }

    const data: Record<string, unknown> = {
      clientId: clientId ?? null,
      projectId: projectId ?? null,
    }

    const newStartedAt = startedAt ? new Date(startedAt) : null
    const newEndedAt = endedAt ? new Date(endedAt) : null
    const now = new Date()

    if (newStartedAt && newStartedAt > now) {
      return { error: "Start time cannot be in the future" }
    }

    if (newEndedAt && newEndedAt > now) {
      return { error: "End time cannot be in the future" }
    }

    const effectiveStart = newStartedAt ?? existing.startedAt
    if (newEndedAt && newEndedAt <= effectiveStart) {
      return { error: "End time must be after start time" }
    }

    if (newStartedAt && !newEndedAt && existing.endedAt && newStartedAt >= existing.endedAt) {
      return { error: "Start time must be before end time" }
    }

    if (newStartedAt) {
      data.startedAt = newStartedAt
    }

    if (newEndedAt) {
      data.endedAt = newEndedAt
      data.status = "ENDED"

      // Close any open break, capping it at the new endedAt
      if (existing.status !== "ENDED") {
        const openBreak = existing.breaks.find(b => !b.endedAt)
        if (openBreak) {
          await prisma.workBreak.update({
            where: { id: openBreak.id },
            data: { endedAt: newEndedAt },
          })
        }
      }

      // Remove breaks that start after the new endedAt
      await prisma.workBreak.deleteMany({
        where: {
          sessionId,
          startedAt: { gte: newEndedAt },
        },
      })
    }

    const workSession = await prisma.workSession.update({
      where: { id: sessionId, userId: user.user.id },
      data,
    })

    revalidatePath("/dashboard")
    return { success: workSession }
  })

export const deleteWorkSession = action
  .schema(WorkSessionDeleteSchema)
  .action(async ({ parsedInput: { sessionId } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    await prisma.workSession.delete({
      where: { id: sessionId, userId: user.user.id },
    })

    revalidatePath("/dashboard")
    return { success: true }
  })
