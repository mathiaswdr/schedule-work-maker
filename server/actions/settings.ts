'use server'

import { createSafeActionClient } from 'next-safe-action';
import { SettingsSchema } from '@/types/settings-schema';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { revalidatePath } from 'next/cache';
import { stripe } from '@/server/stripe';
import { cloudinary } from '@/server/cloudinary';

const action = createSafeActionClient();
const DeleteAccountSchema = z.object({});
const STRIPE_SUBSCRIPTION_STATUSES_TO_CANCEL = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);
const CLOUDINARY_RESOURCE_TYPES = ["image", "raw", "video"] as const;

export const settings = action
  .schema(SettingsSchema)
  .action(async ({ parsedInput: values }) => {
    const user = await auth();
    if (!user) {
      return { error: "User not found" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.user.id },
    });

    if (!dbUser) {
      return { error: "User not found" };
    }

    if (user.user.isOAuth) {
      values.email = undefined;
      values.password = undefined;
      values.newPassword = undefined;
      values.isTwoFactorEnabled = undefined;
    }

    await prisma.user.update({
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
    return { success: true };
  });

export const deleteAccount = action
  .schema(DeleteAccountSchema)
  .action(async () => {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "User not found" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    if (user.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: "all",
          limit: 100,
        });

        await Promise.all(
          subscriptions.data
            .filter((subscription) =>
              STRIPE_SUBSCRIPTION_STATUSES_TO_CANCEL.has(subscription.status)
            )
            .map((subscription) => stripe.subscriptions.cancel(subscription.id))
        );

        await stripe.customers.del(user.stripeCustomerId);
      } catch (error) {
        console.error("Stripe cleanup failed during account deletion:", error);
        return { error: "stripe_cleanup_failed" };
      }
    }

    const hasCloudinaryConfig =
      !!process.env.CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinaryConfig) {
      const cloudinaryPrefix = `temiqo/${user.id}`;

      try {
        await Promise.all(
          CLOUDINARY_RESOURCE_TYPES.map((resourceType) =>
            cloudinary.api.delete_resources_by_prefix(cloudinaryPrefix, {
              resource_type: resourceType,
              type: "upload",
            })
          )
        );

        try {
          await cloudinary.api.delete_folder(cloudinaryPrefix);
        } catch {
          // Ignore empty or already-deleted folders.
        }
      } catch (error) {
        console.error("Cloudinary cleanup failed during account deletion:", error);
        return { error: "cloudinary_cleanup_failed" };
      }
    }

    await prisma.$transaction([
      prisma.accessCodeRedemption.deleteMany({
        where: { userId: user.id },
      }),
      prisma.user.delete({
        where: { id: user.id },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  });
