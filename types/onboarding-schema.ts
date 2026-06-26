import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const OnboardingSchema = z.object({
  name: z.string().trim().min(1).max(100),
  companyName: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(16),
  country: z.string().trim().min(2).max(2),
  email: z.string().trim().email(),
  phone: optionalText(30),
  siret: optionalText(50),
  vatMention: optionalText(300),
  currency: z.string().trim().min(3).max(3),
  hourlyRate: z.coerce.number().min(0.01),
  bankLabel: optionalText(100),
  bankName: optionalText(200),
  iban: optionalText(50),
  bic: optionalText(20),
});
