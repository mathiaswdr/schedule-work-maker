'use server'

import { createSafeActionClient } from 'next-safe-action'
import { ClientSchema, ClientUpdateSchema, ClientDeleteSchema, ClientImportSchema } from '@/types/client-schema'
import { auth } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { revalidatePath } from 'next/cache'
import { type PlanId } from '@/lib/plans'
import { checkClientLimit } from '@/lib/plan-limits'

const action = createSafeActionClient()
const IMPORT_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
]

const normalizeClientName = (value: string) => value.trim().toLocaleLowerCase()

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

export const importClients = action
  .schema(ClientImportSchema)
  .action(async ({ parsedInput: { clients } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const plan = (user.user.plan ?? "FREE") as PlanId
    const limit = await checkClientLimit(user.user.id, plan)

    const uniqueClients = Array.from(
      new Map(
        clients.map((client) => [normalizeClientName(client.name), client])
      ).values()
    )

    const existingClients = await prisma.client.findMany({
      where: { userId: user.user.id },
      select: { name: true },
    })
    const existingNames = new Set(existingClients.map((client) => normalizeClientName(client.name)))

    const clientsToCreate = uniqueClients.filter(
      (client) => !existingNames.has(normalizeClientName(client.name))
    )

    if (clientsToCreate.length === 0) {
      return {
        error: "no_new_clients",
        skippedExistingCount: uniqueClients.length,
      }
    }

    if (limit.max !== null) {
      const remaining = Math.max(limit.max - limit.current, 0)
      if (clientsToCreate.length > remaining) {
        return {
          error: "limit",
          remaining,
          attempted: clientsToCreate.length,
        }
      }
    }

    await prisma.client.createMany({
      data: clientsToCreate.map((client, index) => ({
        userId: user.user.id,
        name: client.name.trim(),
        email: client.email || null,
        address: client.address || null,
        postalCode: client.postalCode || null,
        city: client.city || null,
        country: client.country || null,
        notes: client.notes || null,
        color: IMPORT_COLORS[index % IMPORT_COLORS.length],
      })),
      skipDuplicates: true,
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/clients")

    return {
      success: {
        importedCount: clientsToCreate.length,
        skippedExistingCount: uniqueClients.length - clientsToCreate.length,
        skippedDuplicateCount: clients.length - uniqueClients.length,
      },
    }
  })
