"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import {
  getPlanDisplayName,
  type PlanId,
  type FeatureKey,
  isPlanSufficient,
} from "@/lib/plans";

type PlanGateProps = {
  userPlan: PlanId;
  requiredPlan: PlanId;
  feature: FeatureKey;
  children: React.ReactNode;
};

export default function PlanGate({ userPlan, requiredPlan, feature, children }: PlanGateProps) {
  const t = useTranslations("planGate");

  if (isPlanSufficient(userPlan, requiredPlan)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[6px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-3xl border border-line bg-white/95 px-8 py-10 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.15)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <Lock className="h-5 w-5 text-brand" />
          </div>
          <h3 className="text-lg font-semibold text-ink">
            {t(`${feature}.title`)}
          </h3>
          <p className="text-sm text-ink-muted">
            {t(`${feature}.description`)}
          </p>
          <Link
            href="/dashboard/subscription"
            className="mt-2 rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90"
          >
            {t("upgrade", { plan: getPlanDisplayName(requiredPlan) })}
          </Link>
        </div>
      </div>
    </div>
  );
}
