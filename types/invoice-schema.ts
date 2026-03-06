import { z } from "zod";

export const InvoiceItemSchema = z.object({
  category: z.string().max(100).optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
});

export const InvoiceSchema = z.object({
  clientId: z.string().cuid(),
  projectId: z.string().cuid().optional().nullable(),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  location: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  subject: z.string().max(500).optional(),
  bankName: z.string().max(200).optional(),
  iban: z.string().max(50).optional(),
  bic: z.string().max(20).optional(),
  paymentTerms: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  templateType: z.enum(["CLASSIC", "MODERN", "MINIMAL", "CUSTOM"]),
  customTemplateId: z.string().cuid().optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1),
});

export const InvoiceUpdateSchema = InvoiceSchema.extend({
  id: z.string().cuid(),
});

export const InvoiceDeleteSchema = z.object({
  id: z.string().cuid(),
});

export const InvoiceStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["DRAFT", "SENT", "PAID"]),
});
