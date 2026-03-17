'use client'

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { AuthCard } from "./auth-card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type Status = "idle" | "sending" | "sent" | "error";

type LoginFormProps = {
  showEmailLogin: boolean;
};

export const LoginForm = ({ showEmailLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const t = useTranslations("auth");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const safeEmail = email.trim();

    if (!safeEmail) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    const result = await signIn("email", {
      email: safeEmail,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      setStatus("error");
      return;
    }

    setStatus("sent");
  };

  const helperText =
    status === "sent"
      ? t("helperSent")
      : status === "error"
      ? t("helperError")
      : t("helperIdle");

  return (
    <AuthCard
      cardTitle={t("title")}
      backButtonHref="/auth/register"
      backButtonLabel={t("backLabel")}
      showSocial
    >
      {showEmailLogin ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-sm font-medium text-neutral-900"
            >
              {t("emailLabel")}
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={status === "sending"}
          >
            {status === "sending" ? t("sending") : t("magicLink")}
          </Button>
          <p aria-live="polite" className="text-xs text-neutral-500">
            {helperText}
          </p>
        </form>
      ) : (
        <p className="text-sm text-neutral-500">
          {t("magicLinkUnavailable")}
        </p>
      )}
    </AuthCard>
  );
}
