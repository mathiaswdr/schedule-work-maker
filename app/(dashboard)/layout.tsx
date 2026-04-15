import { Space_Grotesk } from "next/font/google";
import DashboardSidebar from "@/components/dashboard/sidebar";
import BusinessProfilePrompt from "@/components/dashboard/business-profile-prompt";
import { prisma } from "@/server/prisma";
import { getDashboardViewer } from "@/server/dashboard-viewer";

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const REQUIRED_PROFILE_FIELDS = [
  "companyName",
  "address",
  "city",
  "postalCode",
  "country",
  "email",
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, userPlan } = await getDashboardViewer();

  const businessProfile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      companyName: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
      email: true,
    },
  });
  const shouldPromptForBusinessProfile = REQUIRED_PROFILE_FIELDS.some(
    (field) => !businessProfile?.[field]
  );

  return (
    <div className={`${body.className} min-h-screen w-full bg-paper text-ink`}>
      <div className="mx-auto flex w-full maxW flex-col gap-6 px-4 pb-28 pt-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:pb-10">
        <DashboardSidebar userPlan={userPlan} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <BusinessProfilePrompt shouldPrompt={shouldPromptForBusinessProfile} />
    </div>
  );
}
