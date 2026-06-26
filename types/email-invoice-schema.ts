import { z } from "zod";

export const DetectedInvoiceIgnoreSchema = z.object({
  id: z.string().cuid(),
});

export const DetectedInvoiceImportSchema = z.object({
  id: z.string().cuid(),
  vendorName: z.string().min(1).max(200),
  amount: z.number().min(0),
  invoiceDate: z.string().optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
