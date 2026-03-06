"use server";

import { createSafeActionClient } from "next-safe-action";
import {
  UploadedInvoiceSchema,
  UploadedInvoiceUpdateSchema,
} from "@/types/uploaded-invoice-schema";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient();

export const uploadInvoice = action
  .schema(UploadedInvoiceSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    const userId = user.user.id;

    // Shared invoice number sequence
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextNumber = (lastInvoice?.number ?? 0) + 1;

    const displayNumber =
      values.displayNumber?.trim() ||
      `UPL-${String(nextNumber).padStart(3, "0")}`;

    // Snapshot client info
    const client = await prisma.client.findUnique({
      where: { id: values.clientId },
      select: {
        name: true,
        email: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        number: nextNumber,
        displayNumber,
        source: "UPLOADED",
        fileUrl: values.fileUrl,
        status: (values.status as "DRAFT" | "SENT" | "PAID") || "DRAFT",
        clientId: values.clientId,
        projectId: values.projectId || null,
        templateType: "CLASSIC",
        issueDate: new Date(values.issueDate),
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
        notes: values.notes || null,
        total: values.total,
        subtotal: values.total,
        taxRate: 0,
        taxAmount: 0,
        clientName: client?.name || null,
        clientEmail: client?.email || null,
        clientAddress: client?.address || null,
        clientPostalCode: client?.postalCode || null,
        clientCity: client?.city || null,
        clientCountry: client?.country || null,
      },
    });

    revalidatePath("/dashboard/invoices");
    return { success: invoice };
  });

export const updateUploadedInvoice = action
  .schema(UploadedInvoiceUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    const client = await prisma.client.findUnique({
      where: { id: values.clientId },
      select: {
        name: true,
        email: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
      },
    });

    const invoice = await prisma.invoice.update({
      where: { id, userId: user.user.id },
      data: {
        fileUrl: values.fileUrl,
        clientId: values.clientId,
        projectId: values.projectId || null,
        displayNumber: values.displayNumber?.trim() || undefined,
        status: (values.status as "DRAFT" | "SENT" | "PAID") || undefined,
        issueDate: new Date(values.issueDate),
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
        notes: values.notes || null,
        total: values.total,
        subtotal: values.total,
        clientName: client?.name || null,
        clientEmail: client?.email || null,
        clientAddress: client?.address || null,
        clientPostalCode: client?.postalCode || null,
        clientCity: client?.city || null,
        clientCountry: client?.country || null,
      },
    });

    revalidatePath("/dashboard/invoices");
    return { success: invoice };
  });
