import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";

import { LoginForm } from "@/components/auth/login-form";
import {
  isEmailAuthEnabled,
  isLocalMagicLinkMode,
} from "@/server/e2e-auth";
import { buildMarketingMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isEnglish = locale === "en";

  return buildMarketingMetadata({
    title: isEnglish ? "Create an account | Kronoma" : "Inscription | Kronoma",
    description: isEnglish
      ? "Create your Kronoma account to start tracking time, managing clients, and preparing invoices."
      : "Creez votre compte Kronoma pour suivre votre temps, gerer vos clients et preparer vos factures.",
    path: "/auth/signup",
    index: false,
    locale,
  });
}

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <LoginForm
        mode="signup"
        showEmailLogin={isEmailAuthEnabled}
        showLocalMagicLinkTools={isLocalMagicLinkMode}
      />
    </Suspense>
  );
}
