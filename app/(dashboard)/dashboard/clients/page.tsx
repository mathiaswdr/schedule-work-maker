import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import ClientsClient from "@/components/dashboard/clients-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default async function DashboardClientsPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true },
      })
    : null;

  return (
    <ClientsClient
      displayClassName={display.className}
      currency={user?.currency ?? "CHF"}
    />
  );
}
