import { Fraunces } from "next/font/google";
import ProjectsClient from "@/components/dashboard/projects-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default function DashboardProjectsPage() {
  return <ProjectsClient displayClassName={display.className} />;
}
