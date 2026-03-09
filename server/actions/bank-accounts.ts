"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient();

const BankAccountSchema = z.object({
  label: z.string().min(1).max(100),
  bankName: z.string().max(200).optional(),
  iban: z.string().min(5).max(50),
  bic: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

const BankAccountUpdateSchema = BankAccountSchema.extend({
  id: z.string(),
});

const BankAccountDeleteSchema = z.object({
  id: z.string(),
});

export const createBankAccount = action
  .schema(BankAccountSchema)
  .action(async ({ parsedInput: values }) => {
    const session = await auth();
    if (!session) return { error: "User not found" };

    const userId = session.user.id;

    // Check if user has any bank accounts
    const count = await prisma.bankAccount.count({ where: { userId } });
    const shouldBeDefault = count === 0 || values.isDefault === true;

    if (shouldBeDefault && count > 0) {
      // Remove default from other accounts
      await prisma.bankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId,
        label: values.label,
        bankName: values.bankName || null,
        iban: values.iban,
        bic: values.bic || null,
        isDefault: shouldBeDefault,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: bankAccount };
  });

export const updateBankAccount = action
  .schema(BankAccountUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const session = await auth();
    if (!session) return { error: "User not found" };

    const userId = session.user.id;

    if (values.isDefault) {
      await prisma.bankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const bankAccount = await prisma.bankAccount.update({
      where: { id, userId },
      data: {
        label: values.label,
        bankName: values.bankName || null,
        iban: values.iban,
        bic: values.bic || null,
        isDefault: values.isDefault ?? undefined,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: bankAccount };
  });

export const deleteBankAccount = action
  .schema(BankAccountDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const session = await auth();
    if (!session) return { error: "User not found" };

    const userId = session.user.id;

    const account = await prisma.bankAccount.findUnique({
      where: { id, userId },
    });
    if (!account) return { error: "Not found" };

    await prisma.bankAccount.delete({ where: { id, userId } });

    // If deleted account was default, assign default to oldest remaining
    if (account.isDefault) {
      const oldest = await prisma.bankAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (oldest) {
        await prisma.bankAccount.update({
          where: { id: oldest.id },
          data: { isDefault: true },
        });
      }
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  });
