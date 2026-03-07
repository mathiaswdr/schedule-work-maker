import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import StatsClient from "@/components/dashboard/stats-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardStatsPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true, hourlyRate: true },
      })
    : null;

  return (
    <StatsClient
      displayClassName={display.className}
      currency={user?.currency ?? "CHF"}
      hourlyRate={user?.hourlyRate ?? 0}
    />
  );
}
