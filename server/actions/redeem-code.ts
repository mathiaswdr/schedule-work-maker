'use server'

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { prisma } from '@/server/prisma';
import { revalidatePath } from 'next/cache';
import { canUpgrade, type PlanId } from '@/lib/plans';

const action = createSafeActionClient();

const RedeemCodeSchema = z.object({
  code: z.string().min(1),
});

export const redeemAccessCode = action
  .schema(RedeemCodeSchema)
  .action(async ({ parsedInput: { code } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "invalid" as const };
    }

    const userId = session.user.id;

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    if (
      !accessCode ||
      !accessCode.isActive ||
      (accessCode.expiresAt && accessCode.expiresAt < new Date()) ||
      (accessCode.maxUses !== null && accessCode.usedCount >= accessCode.maxUses)
    ) {
      return { error: "invalid" as const };
    }

    const existing = await prisma.accessCodeRedemption.findUnique({
      where: {
        accessCodeId_userId: {
          accessCodeId: accessCode.id,
          userId,
        },
      },
    });

    if (existing) {
      return { error: "already_redeemed" as const };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return { error: "invalid" as const };
    }

    if (!canUpgrade(user.plan, accessCode.plan as PlanId)) {
      return { error: "no_upgrade" as const };
    }

    await prisma.$transaction([
      prisma.accessCode.update({
        where: { id: accessCode.id },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { plan: accessCode.plan },
      }),
      prisma.accessCodeRedemption.create({
        data: {
          accessCodeId: accessCode.id,
          userId,
          previousPlan: user.plan,
          newPlan: accessCode.plan,
        },
      }),
    ]);

    revalidatePath("/dashboard/settings");

    return { success: accessCode.plan };
  });
