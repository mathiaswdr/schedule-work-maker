"use server";

import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";

import {
  DetectedInvoiceIgnoreSchema,
  DetectedInvoiceImportSchema,
} from "@/types/email-invoice-schema";
import { isEmailInvoiceImportEnabled } from "@/lib/feature-flags";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";

const action = createSafeActionClient();

export const ignoreDetectedInvoice = action
  .schema(DetectedInvoiceIgnoreSchema)
  .action(async ({ parsedInput: { id } }) => {
    if (!isEmailInvoiceImportEnabled()) {
      return { error: "Feature disabled" };
    }

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return { error: "User not found" };

    await prisma.detectedInvoice.update({
      where: { id, userId },
      data: { status: "IGNORED" },
    });

    revalidatePath("/dashboard/expenses/email-invoices");
    return { success: true };
  });

export const importDetectedInvoice = action
  .schema(DetectedInvoiceImportSchema)
  .action(async ({ parsedInput: values }) => {
    if (!isEmailInvoiceImportEnabled()) {
      return { error: "Feature disabled" };
    }

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return { error: "User not found" };

    const detectedInvoice = await prisma.detectedInvoice.findFirst({
      where: { id: values.id, userId, status: "PENDING" },
    });

    if (!detectedInvoice) return { error: "Invoice not found" };
    if (!detectedInvoice.attachmentStorageUrl) {
      return { error: "Missing attachment" };
    }
    const attachmentStorageUrl = detectedInvoice.attachmentStorageUrl;

    const invoiceDate = values.invoiceDate
      ? new Date(values.invoiceDate)
      : detectedInvoice.invoiceDate ?? detectedInvoice.receivedAt ?? new Date();

    const expense = await prisma.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          userId,
          name: values.vendorName,
          amount: values.amount,
          recurrence: "ONE_TIME",
          category: values.category || "Email import",
          notes:
            values.notes ||
            detectedInvoice.subject ||
            detectedInvoice.attachmentFileName,
          startDate: invoiceDate,
          isActive: true,
        },
      });

      await tx.expenseReceipt.create({
        data: {
          expenseId: createdExpense.id,
          invoiceNumber: detectedInvoice.subject?.slice(0, 100) ?? null,
          amount: values.amount,
          billedAt: invoiceDate,
          notes: values.notes || detectedInvoice.sender || null,
          fileUrl: attachmentStorageUrl,
          fileName: detectedInvoice.attachmentFileName,
        },
      });

      await tx.detectedInvoice.update({
        where: { id: detectedInvoice.id },
        data: {
          status: "IMPORTED",
          createdExpenseId: createdExpense.id,
          vendorName: values.vendorName,
          totalAmount: values.amount,
          invoiceDate,
        },
      });

      return createdExpense;
    });

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/expenses/email-invoices");
    return { success: expense };
  });
