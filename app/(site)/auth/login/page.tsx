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
    title: isEnglish ? "Sign in | Kronoma" : "Connexion | Kronoma",
    description: isEnglish
      ? "Sign in to Kronoma to access your time tracking, clients, and invoicing."
      : "Connectez-vous a Kronoma pour acceder a votre suivi du temps, vos clients et votre facturation.",
    path: "/auth/login",
    index: false,
    locale,
  });
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm
        mode="login"
        showEmailLogin={isEmailAuthEnabled}
        showLocalMagicLinkTools={isLocalMagicLinkMode}
      />
    </Suspense>
  );
}
