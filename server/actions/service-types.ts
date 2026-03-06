'use server'

import { createSafeActionClient } from 'next-safe-action'
import { ServiceTypeSchema, ServiceTypeUpdateSchema, ServiceTypeDeleteSchema } from '@/types/service-type-schema'
import { auth } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { revalidatePath } from 'next/cache'

const action = createSafeActionClient()

export const createServiceType = action
  .schema(ServiceTypeSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const serviceType = await prisma.serviceType.create({
      data: {
        userId: user.user.id,
        name: values.name,
        color: values.color || null,
      },
    })

    revalidatePath("/dashboard/projects")
    return { success: serviceType }
  })

export const updateServiceType = action
  .schema(ServiceTypeUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const serviceType = await prisma.serviceType.update({
      where: { id, userId: user.user.id },
      data: {
        name: values.name,
        color: values.color || null,
      },
    })

    revalidatePath("/dashboard/projects")
    return { success: serviceType }
  })

export const deleteServiceType = action
  .schema(ServiceTypeDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    await prisma.serviceType.delete({
      where: { id, userId: user.user.id },
    })

    revalidatePath("/dashboard/projects")
    return { success: true }
  })
