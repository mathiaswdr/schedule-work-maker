import { Space_Grotesk } from "next/font/google";
import DashboardSidebar from "@/components/dashboard/sidebar";
import BusinessProfilePrompt from "@/components/dashboard/business-profile-prompt";
import { auth } from "@/server/auth";
import { type PlanId } from "@/lib/plans";

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userPlan = (session?.user?.plan ?? "FREE") as PlanId;

  return (
    <div className={`${body.className} min-h-screen w-full bg-paper text-ink`}>
      <div className="mx-auto flex w-full maxW flex-col gap-6 px-4 pb-28 pt-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:pb-10">
        <DashboardSidebar userPlan={userPlan} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <BusinessProfilePrompt />
    </div>
  );
}
