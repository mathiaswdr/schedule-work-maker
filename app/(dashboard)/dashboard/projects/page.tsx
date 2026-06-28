import { prisma } from "@/server/prisma";
import ProjectsClient from "@/components/dashboard/projects-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { serializeForClient } from "@/lib/utils";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const INITIAL_PROJECTS_PAGE_SIZE = 24;

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
        displayClassName="font-sans tracking-tight"
        initialProjects={serializeForClient(paginatedInitialProjects)}
        initialHasMore={hasMoreInitialProjects}
      />
    </PlanGate>
  );
}
