'use server'

import { createSafeActionClient } from 'next-safe-action'
import { ClientSchema, ClientUpdateSchema, ClientDeleteSchema } from '@/types/client-schema'
import { auth } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { revalidatePath } from 'next/cache'
import { type PlanId } from '@/lib/plans'
import { checkClientLimit } from '@/lib/plan-limits'

const action = createSafeActionClient()

export const createClient = action
  .schema(ClientSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const plan = (user.user.plan ?? "FREE") as PlanId
    const limit = await checkClientLimit(user.user.id, plan)
    if (!limit.allowed) return { error: "limit" }

    const client = await prisma.client.create({
      data: {
        userId: user.user.id,
        name: values.name,
        email: values.email || null,
        address: values.address || null,
        postalCode: values.postalCode || null,
        city: values.city || null,
        country: values.country || null,
        color: values.color || null,
        notes: values.notes || null,
      },
    })

    revalidatePath("/dashboard/clients")
    return { success: client }
  })

export const updateClient = action
  .schema(ClientUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const result = await prisma.client.updateMany({
      where: { id, userId: user.user.id },
      data: {
        name: values.name,
        email: values.email || null,
        address: values.address || null,
        postalCode: values.postalCode || null,
        city: values.city || null,
        country: values.country || null,
        color: values.color || null,
        notes: values.notes || null,
      },
    })

    if (result.count === 0) return { error: "Client not found" }

    const client = await prisma.client.findUnique({
      where: { id },
    })

    if (!client) return { error: "Client not found" }

    revalidatePath("/dashboard/clients")
    return { success: client }
  })

export const deleteClient = action
  .schema(ClientDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const result = await prisma.client.deleteMany({
      where: { id, userId: user.user.id },
    })

    if (result.count === 0) return { error: "Client not found" }

    revalidatePath("/dashboard/clients")
    return { success: true }
  })
