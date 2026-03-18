import { DM_Serif_Display } from "next/font/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { getSessionUserId } from "@/server/work-sessions";
import ProjectsClient from "@/components/dashboard/projects-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { type PlanId } from "@/lib/plans";
import { serializeForClient } from "@/lib/utils";

const INITIAL_PROJECTS_PAGE_SIZE = 24;

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function DashboardProjectsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;
  const userId = await getSessionUserId();
  const initialProjects = await prisma.project.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    take: INITIAL_PROJECTS_PAGE_SIZE + 1,
    include: {
      client: { select: { id: true, name: true, color: true } },
      serviceType: { select: { id: true, name: true, color: true } },
      _count: { select: { workSessions: true } },
    },
  });
  const hasMoreInitialProjects =
    initialProjects.length > INITIAL_PROJECTS_PAGE_SIZE;
  const paginatedInitialProjects = hasMoreInitialProjects
    ? initialProjects.slice(0, INITIAL_PROJECTS_PAGE_SIZE)
    : initialProjects;

  return (
    <PlanGate userPlan={userPlan} requiredPlan="PRO" feature="projects">
      <ProjectsClient
        displayClassName={display.className}
        initialProjects={serializeForClient(paginatedInitialProjects)}
        initialHasMore={hasMoreInitialProjects}
      />
    </PlanGate>
  );
}
