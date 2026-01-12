
import { auth } from "@/server/auth";
import { UserButton } from "./user-button";
import { Button } from "../ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Nav() {
  const session = await auth();
  const t = await getTranslations("nav");

  return (
    <nav className="fixed top-0 z-50 w-screen border-b border-black/5 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex w-full maxW flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            TempoWork
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-700">
            <Link
              href="/pricing"
              className="transition hover:text-neutral-900"
            >
              {t("pricing")}
            </Link>
            <Link href="/about" className="transition hover:text-neutral-900">
              {t("about")}
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="transition hover:text-neutral-900"
              >
                {t("dashboard")}
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!session ? (
              <>
                <Button asChild variant="outline" className="px-4">
                  <Link href="/auth/login">{t("login")}</Link>
                </Button>
                <Button asChild className="px-4">
                  <Link href="/auth/login">{t("trial")}</Link>
                </Button>
              </>
            ) : (
              <UserButton
                expires={session?.expires as string}
                user={session?.user}
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
