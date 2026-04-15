import { DM_Serif_Display } from "next/font/google";
import { prisma } from "@/server/prisma";
import ProjectsClient from "@/components/dashboard/projects-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const INITIAL_PROJECTS_PAGE_SIZE = 24;

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default async function DashboardProjectsPage() {
  const { userId, userPlan } = await getDashboardViewer();
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
