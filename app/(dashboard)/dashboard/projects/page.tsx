import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { getSessionUserId } from "@/server/work-sessions";
import ProjectsClient from "@/components/dashboard/projects-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { type PlanId } from "@/lib/plans";
import { serializeForClient } from "@/lib/utils";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardProjectsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const userId = await getSessionUserId();
  const initialProjects = await prisma.project.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      client: { select: { id: true, name: true, color: true } },
      serviceType: { select: { id: true, name: true, color: true } },
      _count: { select: { workSessions: true } },
    },
  });

  return (
    <PlanGate userPlan={userPlan} requiredPlan="STARTER" feature="projects">
      <ProjectsClient
        displayClassName={display.className}
        initialProjects={serializeForClient(initialProjects)}
      />
    </PlanGate>
  );
}
