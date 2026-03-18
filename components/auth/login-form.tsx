'use client'

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { AuthCard } from "./auth-card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type Status = "idle" | "sending" | "sent" | "opening" | "error";

type LoginFormProps = {
  showEmailLogin: boolean;
  showLocalMagicLinkTools?: boolean;
};

export const LoginForm = ({
  showEmailLogin,
  showLocalMagicLinkTools = false,
}: LoginFormProps) => {
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

  const handleOpenMagicLink = async () => {
    const safeEmail = email.trim();

    if (!safeEmail) {
      setStatus("error");
      return;
    }

    setStatus("opening");

    const response = await fetch(
      `/api/test/auth-link?email=${encodeURIComponent(safeEmail)}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      setStatus("error");
      return;
    }

    const payload = (await response.json()) as { url?: string };

    if (!payload.url) {
      setStatus("error");
      return;
    }

    window.location.assign(payload.url);
  };

  const helperText =
    status === "opening"
      ? t("openingMagicLink")
      : status === "sent"
      ? showLocalMagicLinkTools
        ? t("helperSentLocal")
        : t("helperSent")
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
          {showLocalMagicLinkTools ? (
            <p className="text-xs text-neutral-500">
              {t("localMagicLinkMode")}
            </p>
          ) : null}
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
            disabled={status === "sending" || status === "opening"}
          >
            {status === "sending" ? t("sending") : t("magicLink")}
          </Button>
          {showLocalMagicLinkTools && (status === "sent" || status === "opening") ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOpenMagicLink}
              disabled={status === "opening"}
            >
              {status === "opening"
                ? t("openingMagicLink")
                : t("openLocalMagicLink")}
            </Button>
          ) : null}
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
