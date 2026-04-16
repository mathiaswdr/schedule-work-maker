import { auth } from "@/server/auth";
import { getTranslations } from "next-intl/server";
import NavClient from "./nav-client";

export default async function Nav() {
  const [session, t] = await Promise.all([auth(), getTranslations("nav")]);

  return (
    <NavClient
      user={session?.user ?? null}
      labels={{
        home: t("home"),
        pricing: t("pricing"),
        about: t("about"),
        faq: t("faq"),
        login: t("login"),
        trial: t("trial"),
        dashboard: t("dashboard"),
      }}
    />
  );
}
