import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/server/auth";

function getConfiguredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function hasAdminAccess(session: Session | null | undefined) {
  const role = session?.user?.role?.trim().toLowerCase();
  const email = session?.user?.email?.trim().toLowerCase();

  if (role === "admin") return true;
  return Boolean(email && getConfiguredAdminEmails().has(email));
}

export const getAdminSession = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (!hasAdminAccess(session)) {
    notFound();
  }

  return session;
});

export async function getAdminActionError() {
  const session = await auth();

  if (!session?.user?.id) {
    return "UNAUTHORIZED" as const;
  }

  if (!hasAdminAccess(session)) {
    return "FORBIDDEN" as const;
  }

  return null;
}
