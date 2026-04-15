import { z } from "zod"

export const ExpenseSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().min(0),
  recurrence: z.enum(["MONTHLY", "ANNUAL", "ONE_TIME"]),
  category: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
})

export const ExpenseUpdateSchema = ExpenseSchema.extend({
  id: z.string().cuid(),
})

export const ExpenseDeleteSchema = z.object({
  id: z.string().cuid(),
})

export const ExpenseInvoiceSchema = z.object({
  expenseId: z.string().cuid(),
  invoiceNumber: z.string().max(100).optional(),
  amount: z.number().min(0).optional(),
  billedAt: z.string(),
  notes: z.string().max(500).optional(),
  fileUrl: z.string().url(),
  fileName: z.string().max(500).optional(),
})

export const ExpenseInvoiceDeleteSchema = z.object({
  id: z.string().cuid(),
})
