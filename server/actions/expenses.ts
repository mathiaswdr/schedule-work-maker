'use server'

import { createSafeActionClient } from 'next-safe-action'
import {
  ExpenseSchema,
  ExpenseUpdateSchema,
  ExpenseDeleteSchema,
  ExpenseInvoiceSchema,
  ExpenseInvoiceDeleteSchema,
} from '@/types/expense-schema'
import { auth } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { revalidatePath } from 'next/cache'

const action = createSafeActionClient()

export const createExpense = action
  .schema(ExpenseSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const expense = await prisma.expense.create({
      data: {
        userId: user.user.id,
        name: values.name,
        amount: values.amount,
        recurrence: values.recurrence,
        category: values.category || null,
        notes: values.notes || null,
        color: values.color || null,
        isActive: values.isActive ?? true,
        startDate: values.startDate ? new Date(values.startDate) : new Date(),
      },
    })

    revalidatePath("/dashboard/expenses")
    return { success: expense }
  })

export const updateExpense = action
  .schema(ExpenseUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    const expense = await prisma.expense.update({
      where: { id, userId: user.user.id },
      data: {
        name: values.name,
        amount: values.amount,
        recurrence: values.recurrence,
        category: values.category || null,
        notes: values.notes || null,
        color: values.color || null,
        isActive: values.isActive ?? true,
        startDate: values.startDate ? new Date(values.startDate) : undefined,
      },
    })

    revalidatePath("/dashboard/expenses")
    return { success: expense }
  })

export const deleteExpense = action
  .schema(ExpenseDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    await prisma.expense.delete({
      where: { id, userId: user.user.id },
    })

    revalidatePath("/dashboard/expenses")
    return { success: true }
  })

export const addExpenseInvoice = action
  .schema(ExpenseInvoiceSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    // Verify expense belongs to user
    const expense = await prisma.expense.findFirst({
      where: { id: values.expenseId, userId: user.user.id },
    })
    if (!expense) return { error: "Expense not found" }

    const invoice = await prisma.expenseReceipt.create({
      data: {
        expenseId: values.expenseId,
        invoiceNumber: values.invoiceNumber || null,
        amount: values.amount ?? null,
        billedAt: new Date(values.billedAt),
        notes: values.notes || null,
        fileUrl: values.fileUrl,
        fileName: values.fileName || null,
      },
    })

    revalidatePath("/dashboard/expenses")
    return { success: invoice }
  })

export const deleteExpenseInvoice = action
  .schema(ExpenseInvoiceDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth()
    if (!user) return { error: "User not found" }

    // Verify ownership via expense
    const invoice = await prisma.expenseReceipt.findFirst({
      where: { id },
      include: { expense: { select: { userId: true } } },
    })
    if (!invoice || invoice.expense.userId !== user.user.id) {
      return { error: "Invoice not found" }
    }

    await prisma.expenseReceipt.delete({ where: { id } })

    revalidatePath("/dashboard/expenses")
    return { success: true }
  })
