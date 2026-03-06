'use server'

import { createSafeActionClient } from 'next-safe-action'
import { ClientSchema, ClientUpdateSchema, ClientDeleteSchema } from '@/types/client-schema'
import { auth } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { revalidatePath } from 'next/cache'

const action = createSafeActionClient()

export const createClient = action
  .schema(ClientSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

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

    const client = await prisma.client.update({
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

    revalidatePath("/dashboard/clients")
    return { success: client }
  })

export const deleteClient = action
  .schema(ClientDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    await prisma.client.delete({
      where: { id, userId: user.user.id },
    })

    revalidatePath("/dashboard/clients")
    return { success: true }
  })
