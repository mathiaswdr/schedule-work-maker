'use server'

import { createSafeActionClient } from 'next-safe-action';
import { SettingsSchema } from '@/types/settings-schema';
import { z } from 'zod';
import { auth } from '@/server/auth'; // Garde ton système d'auth tel qu'il est
import { prisma } from '@/server/prisma'; // Assure-toi d'avoir ce chemin correct vers Prisma
import { revalidatePath } from 'next/cache';

const action = createSafeActionClient();

export const settings = action
  .schema(SettingsSchema)
  .action(async ({ parsedInput: values }) => {

    // Authentification de l'utilisateur
    const user = await auth();
    if (!user) {
      return { error: "User not found" };
    }

    // console.log("settings.ts")
    // Recherche de l'utilisateur dans la base de données via Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: user.user.id },
    });

    // console.log("dbUser : ", dbUser)

    if (!dbUser) {
      return { error: "User not found" };
    }

    // Si l'utilisateur est connecté via OAuth, on ne peut pas modifier ces champs
    if (user.user.isOAuth) {
      values.email = undefined;
      values.password = undefined;
      values.newPassword = undefined;
      values.isTwoFactorEnabled = undefined;
    }

    // Mise à jour de l'utilisateur dans la base de données
    const updateUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        isTwoFactorEnabled: values.isTwoFactorEnabled,
        name: values.name,
        email: values.email,
        image: values.image,
        currency: values.currency,
        hourlyRate: values.hourlyRate,
      },
    });

    revalidatePath("/dashboard/settings");
  });