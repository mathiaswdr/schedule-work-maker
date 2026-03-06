import { z } from "zod";

export const UploadedInvoiceSchema = z.object({
  fileUrl: z.string().url(),
  clientId: z.string().cuid(),
  projectId: z.string().cuid().optional().nullable(),
  displayNumber: z.string().max(50).optional(),
  total: z.number().min(0),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional(),
  status: z.enum(["DRAFT", "SENT", "PAID"]).optional(),
});

export const UploadedInvoiceUpdateSchema = UploadedInvoiceSchema.extend({
  id: z.string().cuid(),
});
