'use server'

import { createSafeActionClient } from 'next-safe-action';
import { SettingsSchema } from '@/types/settings-schema';
import { z } from 'zod';
import { createHmac } from 'node:crypto';
import { auth } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { revalidatePath } from 'next/cache';
import { stripe } from '@/server/stripe';
import { cloudinary } from '@/server/cloudinary';

const action = createSafeActionClient();
const AccountDeletionReasonSchema = z.enum([
  "noLongerNeed",
  "tooExpensive",
  "missingFeature",
  "hardToUse",
  "switchedTool",
  "privacy",
  "other",
]);
const DeleteAccountSchema = z.object({
  feedback: z
    .object({
      reasons: z.array(AccountDeletionReasonSchema).min(1),
      customReason: z.string().trim().max(500).optional(),
    })
    .superRefine((feedback, ctx) => {
      if (
        feedback.reasons.includes("other") &&
        !feedback.customReason?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom reason is required when other is selected",
          path: ["customReason"],
        });
      }
    }),
});
const STRIPE_SUBSCRIPTION_STATUSES_TO_CANCEL = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);
const CLOUDINARY_RESOURCE_TYPES = ["image", "raw", "video"] as const;
const ACCOUNT_DELETION_FEEDBACK_HASH_SECRET =
  process.env.ACCOUNT_DELETION_FEEDBACK_HASH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "kronoma-account-deletion-feedback";

const hashDeletionFeedbackIdentifier = (value: string | null | undefined) => {
  if (!value) return null;

  return createHmac("sha256", ACCOUNT_DELETION_FEEDBACK_HASH_SECRET)
    .update(value.trim().toLowerCase())
    .digest("hex");
};

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
  .action(async ({ parsedInput }) => {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "User not found" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        plan: true,
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
      const cloudinaryPrefix = `kronoma/${user.id}`;

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
      prisma.accountDeletionFeedback.create({
        data: {
          userIdHash: hashDeletionFeedbackIdentifier(user.id)!,
          emailHash: hashDeletionFeedbackIdentifier(user.email),
          plan: user.plan,
          reasons: parsedInput.feedback.reasons,
          customReason: parsedInput.feedback.customReason || null,
        },
      }),
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
