import { Fraunces } from "next/font/google";
import { auth } from "@/server/auth";
import ProjectsClient from "@/components/dashboard/projects-client";
import PlanGate from "@/components/dashboard/plan-gate";
import { type PlanId } from "@/lib/plans";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default async function DashboardProjectsPage() {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;

  return (
    <PlanGate userPlan={userPlan} requiredPlan="STARTER" feature="projects">
      <ProjectsClient displayClassName={display.className} />
    </PlanGate>
  );
}
