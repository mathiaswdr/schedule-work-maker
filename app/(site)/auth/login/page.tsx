import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import {
  isEmailAuthEnabled,
  isLocalMagicLinkMode,
} from "@/server/e2e-auth";
import { buildMarketingMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Connexion | Kronoma",
  description:
    "Connectez-vous a Kronoma pour acceder a votre suivi du temps, vos clients et votre facturation.",
  path: "/auth/login",
  index: false,
});

export default function Login() {
  return (
    <section className="min-h-screen w-full flex items-center justify-center px-4 py-10">
      <LoginForm
        showEmailLogin={isEmailAuthEnabled}
        showLocalMagicLinkTools={isLocalMagicLinkMode}
      />
    </section>
  );
}
