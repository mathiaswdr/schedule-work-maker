'use client'

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthCard, type AuthMode } from "./auth-card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Socials from "./socials";

type Status = "idle" | "sending" | "sent" | "opening" | "error";

type LoginFormProps = {
  mode?: AuthMode;
  showEmailLogin: boolean;
  showLocalMagicLinkTools?: boolean;
};

export const LoginForm = ({
  mode = "login",
  showEmailLogin,
  showLocalMagicLinkTools = false,
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl?.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/dashboard";
  const alternatePath = mode === "login" ? "/auth/signup" : "/auth/login";
  const alternateHref = rawCallbackUrl
    ? `${alternatePath}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : alternatePath;

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
      callbackUrl,
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
      mode={mode}
      alternateHref={alternateHref}
    >
      <Socials mode={mode} />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
          {t("emailDivider")}
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {showEmailLogin ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {showLocalMagicLinkTools ? (
            <p className="rounded-lg border border-brand-3/40 bg-brand-3/10 px-3 py-2 text-xs leading-5 text-ink-muted">
              {t("localMagicLinkMode")}
            </p>
          ) : null}
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-sm font-semibold text-ink"
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
              className="h-11 border-line bg-white text-ink placeholder:text-ink-muted/60 focus-visible:ring-brand/40"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-brand text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.95)] hover:bg-brand/90"
            disabled={status === "sending" || status === "opening"}
          >
            {status === "sending"
              ? t("sending")
              : t(mode === "signup" ? "signupMagicLink" : "loginMagicLink")}
          </Button>
          {showLocalMagicLinkTools && (status === "sent" || status === "opening") ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full border-line text-ink hover:bg-ink-soft"
              onClick={handleOpenMagicLink}
              disabled={status === "opening"}
            >
              {status === "opening"
                ? t("openingMagicLink")
                : t("openLocalMagicLink")}
            </Button>
          ) : null}
          <p aria-live="polite" className="text-xs leading-5 text-ink-muted">
            {helperText}
          </p>
        </form>
      ) : (
        <p className="rounded-lg border border-line bg-panel px-4 py-3 text-sm leading-6 text-ink-muted">
          {t("magicLinkUnavailable")}
        </p>
      )}
    </AuthCard>
  );
}
