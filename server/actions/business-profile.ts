"use server";

import { createSafeActionClient } from "next-safe-action";
import { BusinessProfileSchema } from "@/types/business-profile-schema";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient();

export const upsertBusinessProfile = action
  .schema(BusinessProfileSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth();
    if (!user) return { error: "User not found" };

    const profile = await prisma.businessProfile.upsert({
      where: { userId: user.user.id },
      create: {
        userId: user.user.id,
        companyName: values.companyName || null,
        address: values.address || null,
        city: values.city || null,
        postalCode: values.postalCode || null,
        country: values.country || null,
        siret: values.siret || null,
        email: values.email || null,
        phone: values.phone || null,
        logoUrl: values.logoUrl || null,
        vatMention: values.vatMention || null,
      },
      update: {
        companyName: values.companyName || null,
        address: values.address || null,
        city: values.city || null,
        postalCode: values.postalCode || null,
        country: values.country || null,
        siret: values.siret || null,
        email: values.email || null,
        phone: values.phone || null,
        logoUrl: values.logoUrl || null,
        vatMention: values.vatMention || null,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: profile };
  });
