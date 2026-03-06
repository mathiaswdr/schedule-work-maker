import { z } from "zod";

export const InvoiceTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  fileUrl: z.string().url(),
});

export const InvoiceTemplateDeleteSchema = z.object({
  id: z.string().cuid(),
});
