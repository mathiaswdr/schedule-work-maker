import { Fraunces } from "next/font/google";
import StatsClient from "@/components/dashboard/stats-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default function DashboardStatsPage() {
  return <StatsClient displayClassName={display.className} />;
}
