"use server";

import { createSafeActionClient } from "next-safe-action";
import {
  InvoiceSchema,
  InvoiceUpdateSchema,
  InvoiceDeleteSchema,
  InvoiceStatusSchema,
} from "@/types/invoice-schema";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { revalidatePath } from "next/cache";
import {
  formatInvoiceNumber,
  computeInvoiceTotals,
} from "@/lib/invoice-helpers";

const action = createSafeActionClient();

export const createInvoice = action
  .schema(InvoiceSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    const userId = user.user.id;

    // Parallel fetch: invoice number, business profile, client snapshot
    const [lastInvoice, profile, client] = await Promise.all([
      prisma.invoice.findFirst({
        where: { userId },
        orderBy: { number: "desc" },
        select: { number: true },
      }),
      prisma.businessProfile.findUnique({
        where: { userId },
      }),
      prisma.client.findUnique({
        where: { id: values.clientId },
        select: { name: true, email: true, address: true, postalCode: true, city: true, country: true },
      }),
    ]);
    const nextNumber = (lastInvoice?.number ?? 0) + 1;

    // Compute totals
    const items = values.items.map((item, index) => ({
      ...item,
      amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
      sortOrder: index,
    }));
    const totals = computeInvoiceTotals(items, values.taxRate);

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        number: nextNumber,
        displayNumber: formatInvoiceNumber(nextNumber),
        clientId: values.clientId,
        projectId: values.projectId || null,
        templateType: values.templateType as "CLASSIC" | "MODERN" | "MINIMAL" | "CUSTOM",
        customTemplateId: values.customTemplateId || null,
        issueDate: new Date(values.issueDate),
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
        notes: values.notes || null,
        taxRate: values.taxRate ?? 0,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        senderName: profile?.companyName || null,
        senderAddress: profile?.address || null,
        senderPostalCode: profile?.postalCode || null,
        senderCity: profile?.city || null,
        senderCountry: profile?.country || null,
        senderSiret: profile?.siret || null,
        senderEmail: profile?.email || null,
        senderPhone: profile?.phone || null,
        senderLogoUrl: profile?.logoUrl || null,
        senderVatMention: profile?.vatMention || null,
        clientName: client?.name || null,
        clientEmail: client?.email || null,
        clientAddress: client?.address || null,
        clientPostalCode: client?.postalCode || null,
        clientCity: client?.city || null,
        clientCountry: client?.country || null,
        location: values.location || null,
        title: values.title || null,
        subject: values.subject || null,
        bankName: values.bankName || null,
        iban: values.iban || null,
        bic: values.bic || null,
        paymentTerms: values.paymentTerms || null,
        items: {
          create: items.map((item) => ({
            category: item.category || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { items: true },
    });

    revalidatePath("/dashboard/invoices");
    return { success: invoice };
  });

export const updateInvoice = action
  .schema(InvoiceUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    const [profile, client] = await Promise.all([
      prisma.businessProfile.findUnique({
        where: { userId: user.user.id },
      }),
      prisma.client.findUnique({
        where: { id: values.clientId },
        select: { name: true, email: true, address: true, postalCode: true, city: true, country: true },
      }),
    ]);

    const items = values.items.map((item, index) => ({
      ...item,
      amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
      sortOrder: index,
    }));
    const totals = computeInvoiceTotals(items, values.taxRate);

    // Delete existing items and recreate
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id, userId: user.user.id },
      data: {
        clientId: values.clientId,
        projectId: values.projectId || null,
        templateType: values.templateType as "CLASSIC" | "MODERN" | "MINIMAL" | "CUSTOM",
        customTemplateId: values.customTemplateId || null,
        issueDate: new Date(values.issueDate),
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
        notes: values.notes || null,
        taxRate: values.taxRate ?? 0,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        senderName: profile?.companyName || null,
        senderAddress: profile?.address || null,
        senderPostalCode: profile?.postalCode || null,
        senderCity: profile?.city || null,
        senderCountry: profile?.country || null,
        senderSiret: profile?.siret || null,
        senderEmail: profile?.email || null,
        senderPhone: profile?.phone || null,
        senderLogoUrl: profile?.logoUrl || null,
        senderVatMention: profile?.vatMention || null,
        clientName: client?.name || null,
        clientEmail: client?.email || null,
        clientAddress: client?.address || null,
        clientPostalCode: client?.postalCode || null,
        clientCity: client?.city || null,
        clientCountry: client?.country || null,
        location: values.location || null,
        title: values.title || null,
        subject: values.subject || null,
        bankName: values.bankName || null,
        iban: values.iban || null,
        bic: values.bic || null,
        paymentTerms: values.paymentTerms || null,
        items: {
          create: items.map((item) => ({
            category: item.category || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { items: true },
    });

    revalidatePath("/dashboard/invoices");
    return { success: invoice };
  });

export const deleteInvoice = action
  .schema(InvoiceDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    await prisma.invoice.delete({
      where: { id, userId: user.user.id },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true };
  });

export const updateInvoiceStatus = action
  .schema(InvoiceStatusSchema)
  .action(async ({ parsedInput: { id, status } }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    const invoice = await prisma.invoice.update({
      where: { id, userId: user.user.id },
      data: { status: status as "DRAFT" | "SENT" | "PAID" },
    });

    revalidatePath("/dashboard/invoices");
    return { success: invoice };
  });
