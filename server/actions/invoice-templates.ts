"use server";

import { createSafeActionClient } from "next-safe-action";
import {
  InvoiceTemplateSchema,
  InvoiceTemplateDeleteSchema,
} from "@/types/invoice-template-schema";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient();

export const createInvoiceTemplate = action
  .schema(InvoiceTemplateSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    const template = await prisma.invoiceTemplate.create({
      data: {
        userId: user.user.id,
        name: values.name,
        type: "CUSTOM",
        fileUrl: values.fileUrl,
      },
    });

    revalidatePath("/dashboard/invoices");
    return { success: template };
  });

export const deleteInvoiceTemplate = action
  .schema(InvoiceTemplateDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    await prisma.invoiceTemplate.delete({
      where: { id, userId: user.user.id },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true };
  });
