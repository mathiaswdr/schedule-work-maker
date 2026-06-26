"use server";

import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { OnboardingSchema } from "@/types/onboarding-schema";

const action = createSafeActionClient();

export const completeOnboarding = action
  .schema(OnboardingSchema)
  .action(async ({ parsedInput: values }) => {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "User not found" };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.id },
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const userId = user.id;
    const iban = values.iban?.trim();
    const bankLabel = values.bankLabel?.trim();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: values.name,
          currency: values.currency.toUpperCase(),
          hourlyRate: values.hourlyRate,
          onboardingCompletedAt: new Date(),
        },
      });

      await tx.businessProfile.upsert({
        where: { userId },
        create: {
          userId,
          companyName: values.companyName,
          address: values.address,
          city: values.city,
          postalCode: values.postalCode,
          country: values.country.toUpperCase(),
          email: values.email,
          phone: values.phone || null,
          siret: values.siret || null,
          vatMention: values.vatMention || null,
        },
        update: {
          companyName: values.companyName,
          address: values.address,
          city: values.city,
          postalCode: values.postalCode,
          country: values.country.toUpperCase(),
          email: values.email,
          phone: values.phone || null,
          siret: values.siret || null,
          vatMention: values.vatMention || null,
        },
      });

      if (iban && bankLabel) {
        const bankAccountCount = await tx.bankAccount.count({
          where: { userId },
        });

        if (bankAccountCount === 0) {
          await tx.bankAccount.create({
            data: {
              userId,
              label: bankLabel,
              bankName: values.bankName || null,
              iban,
              bic: values.bic || null,
              isDefault: true,
            },
          });
        }
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true };
  });
