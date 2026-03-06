import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import SessionsClient from "@/components/dashboard/sessions-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default async function DashboardSessionsPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true, hourlyRate: true },
      })
    : null;

  return (
    <SessionsClient
      displayClassName={display.className}
      currency={user?.currency ?? "CHF"}
      hourlyRate={user?.hourlyRate ?? 0}
    />
  );
}
