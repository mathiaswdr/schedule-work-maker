import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import SettingsCard from "./settings-card";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default async function Settings() {
  const session = await auth();

  if (!session) redirect("/");

  const [businessProfile, user] = await Promise.all([
    prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true, hourlyRate: true },
    }),
  ]);

  return (
    <SettingsCard
      session={session}
      businessProfile={businessProfile}
      currency={user?.currency ?? "CHF"}
      hourlyRate={user?.hourlyRate ?? 0}
      displayClassName={display.className}
    />
  );
}
