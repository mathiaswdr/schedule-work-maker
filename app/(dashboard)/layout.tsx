import { Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardOnboardingModal from "@/components/dashboard/dashboard-onboarding-modal";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  const [
    { session, userPlan, currency, hourlyRate, onboardingCompletedAt },
    locale,
    messages,
    t,
    tc,
  ] = await Promise.all([
    getDashboardViewer(),
    getLocale(),
    getMessages(),
    getTranslations("dashboard"),
    getTranslations("common"),
  ]);

  const [businessProfile, bankAccountCount] = await Promise.all([
    prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        companyName: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        siret: true,
        email: true,
        phone: true,
        vatMention: true,
      },
    }),
    prisma.bankAccount.count({
      where: { userId: session.user.id },
    }),
  ]);
  const shouldPromptForBusinessProfile = REQUIRED_PROFILE_FIELDS.some(
    (field) => !businessProfile?.[field]
  );
  const shouldPromptForOnboarding =
    !onboardingCompletedAt &&
    (shouldPromptForBusinessProfile ||
      !session.user.name?.trim() ||
      hourlyRate <= 0);

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

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={pickMessages(messages, DASHBOARD_MESSAGE_NAMESPACES)}
    >
      <div
        className={`${body.className} min-h-screen w-full bg-white text-ink [--accent:36_35%_95%] [--accent-foreground:35_14%_10%] [--background:0_0%_100%] [--border:34_18%_88%] [--card:0_0%_100%] [--card-foreground:35_14%_10%] [--foreground:35_14%_10%] [--muted:36_35%_95%] [--muted-foreground:28_8%_42%] [--primary:24_95%_53%] [--primary-foreground:0_0%_100%] [--ring:24_95%_53%] [--secondary:36_35%_95%] [--secondary-foreground:35_14%_10%] [--sidebar-accent:36_35%_95%] [--sidebar-accent-foreground:35_14%_10%] [--sidebar-background:0_0%_100%] [--sidebar-border:34_18%_88%] [--sidebar-foreground:28_8%_42%] [--sidebar-primary:24_95%_53%] [--sidebar-primary-foreground:0_0%_100%] [--sidebar-ring:24_95%_53%]`}
      >
        <SidebarProvider>
          <DashboardSidebar
            variant="inset"
            userPlan={userPlan}
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
            labels={sidebarLabels}
          />
          <SidebarInset className="bg-white">
            <div className="@container/main min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6 [content-visibility:auto] [contain-intrinsic-size:1px_900px]">
              <SidebarTrigger className="mb-4 -ml-1 text-ink-muted hover:bg-ink-soft hover:text-ink" />
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
        <DashboardOnboardingModal
          shouldPrompt={shouldPromptForOnboarding}
          initialData={{
            name: session.user.name ?? null,
            email: session.user.email ?? null,
            currency,
            hourlyRate,
            businessProfile,
            hasBankAccount: bankAccountCount > 0,
          }}
        />
      </div>
    </NextIntlClientProvider>
  );
}
