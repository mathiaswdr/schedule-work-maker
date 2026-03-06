'use server'

import { createSafeActionClient } from 'next-safe-action'
import { ProjectSchema, ProjectUpdateSchema, ProjectDeleteSchema } from '@/types/project-schema'
import { auth } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { revalidatePath } from 'next/cache'

const action = createSafeActionClient()

export const createProject = action
  .schema(ProjectSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const project = await prisma.project.create({
      data: {
        userId: user.user.id,
        name: values.name,
        description: values.description || null,
        clientId: values.clientId || null,
        serviceTypeId: values.serviceTypeId || null,
      },
    })

    revalidatePath("/dashboard/projects")
    return { success: project }
  })

export const updateProject = action
  .schema(ProjectUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const project = await prisma.project.update({
      where: { id, userId: user.user.id },
      data: {
        name: values.name,
        description: values.description || null,
        clientId: values.clientId || null,
        serviceTypeId: values.serviceTypeId || null,
      },
    })

    revalidatePath("/dashboard/projects")
    return { success: project }
  })

export const deleteProject = action
  .schema(ProjectDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    await prisma.project.delete({
      where: { id, userId: user.user.id },
    })

    revalidatePath("/dashboard/projects")
    return { success: true }
  })
