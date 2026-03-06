import { z } from "zod";

export const BusinessProfileSchema = z.object({
  companyName: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(200).optional(),
  postalCode: z.string().max(16).optional(),
  country: z.string().max(2).optional(),
  siret: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  vatMention: z.string().max(300).optional(),
});
