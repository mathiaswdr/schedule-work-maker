import { Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import DashboardSidebar from "@/components/dashboard/sidebar";
import BusinessProfilePrompt from "@/components/dashboard/business-profile-prompt";
import { prisma } from "@/server/prisma";
import { getDashboardViewer } from "@/server/dashboard-viewer";
import { pickMessages } from "@/lib/i18n";

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

const DASHBOARD_MESSAGE_NAMESPACES = ["dashboard", "common", "planGate"] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ session, userPlan }, locale, messages, t, tc] = await Promise.all([
    getDashboardViewer(),
    getLocale(),
    getMessages(),
    getTranslations("dashboard"),
    getTranslations("common"),
  ]);

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

  const sidebarLabels = {
    subtitle: t("sidebar.subtitle"),
    title: t("sidebar.title"),
    hint: t("sidebar.hint"),
    more: t("sidebar.more"),
    signOut: t("sidebar.signOut"),
    signOutConfirmTitle: t("sidebar.signOutConfirmTitle"),
    signOutConfirmDescription: t("sidebar.signOutConfirmDescription"),
    cancel: tc("cancel"),
    items: {
      time: t("sidebar.time"),
      sessions: t("sidebar.sessions"),
      clients: t("sidebar.clients"),
      projects: t("sidebar.projects"),
      invoices: t("sidebar.invoices"),
      expenses: t("sidebar.expenses"),
      stats: t("sidebar.stats"),
      statsProductivity: t("sidebar.statsProductivity"),
      statsBilling: t("sidebar.statsBilling"),
      subscription: t("sidebar.subscription"),
      settings: t("sidebar.settings"),
    },
  };

  const businessProfilePromptLabels = {
    title: t("sidebar.profilePrompt.title"),
    subtitle: t("sidebar.profilePrompt.subtitle"),
    cta: t("sidebar.profilePrompt.cta"),
    dismiss: t("sidebar.profilePrompt.dismiss"),
  };

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={pickMessages(messages, DASHBOARD_MESSAGE_NAMESPACES)}
    >
      <div className={`${body.className} min-h-screen w-full bg-paper text-ink`}>
        <div className="mx-auto flex w-full maxW flex-col gap-6 px-4 pb-28 pt-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:pb-10">
          <DashboardSidebar
            userPlan={userPlan}
            user={{
              name: session.user.name,
              image: session.user.image,
            }}
            labels={sidebarLabels}
          />
          <div className="min-w-0 flex-1 [content-visibility:auto] [contain-intrinsic-size:1px_900px]">
            {children}
          </div>
        </div>
        <BusinessProfilePrompt
          shouldPrompt={shouldPromptForBusinessProfile}
          labels={businessProfilePromptLabels}
        />
      </div>
    </NextIntlClientProvider>
  );
}
