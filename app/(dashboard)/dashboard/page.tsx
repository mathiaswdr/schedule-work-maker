import { Fraunces } from "next/font/google";
import TimeTrackingClient from "@/components/dashboard/time-tracking-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default function DashboardPage() {
  return <TimeTrackingClient displayClassName={display.className} />;
}
