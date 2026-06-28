"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  FolderKanban,
  History,
  LogOut,
  MoreVertical,
  Receipt,
  Settings2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { markDashboardNavigationStart } from "@/lib/perf-metrics";
import {
  FEATURE_PLAN_MAP,
  type FeatureKey,
  type PlanId,
  getPlanDisplayName,
  isPlanSufficient,
} from "@/lib/plans";

const navItems: { href: string; icon: typeof Clock; key: FeatureKey }[] = [
  { href: "/dashboard", icon: Clock, key: "time" },
  { href: "/dashboard/sessions", icon: History, key: "sessions" },
  { href: "/dashboard/clients", icon: Users, key: "clients" },
  { href: "/dashboard/projects", icon: FolderKanban, key: "projects" },
  { href: "/dashboard/invoices", icon: FileText, key: "invoices" },
  { href: "/dashboard/expenses", icon: Receipt, key: "expenses" },
  { href: "/dashboard/stats", icon: BarChart3, key: "stats" },
  { href: "/dashboard/subscription", icon: CreditCard, key: "subscription" },
  { href: "/dashboard/settings", icon: Settings2, key: "settings" },
];

const statsChildren = [
  { href: "/dashboard/stats/productivity", labelKey: "statsProductivity" },
  { href: "/dashboard/stats/billing", labelKey: "statsBilling" },
] as const;

type SidebarLabels = {
  subtitle: string;
  title: string;
  hint: string;
  more: string;
  signOut: string;
  signOutConfirmTitle: string;
  signOutConfirmDescription: string;
  cancel: string;
  items: Record<FeatureKey | "statsProductivity" | "statsBilling", string>;
};

function PlanBadge({ requiredPlan }: { requiredPlan: PlanId }) {
  return (
    <span className="rounded-md border border-brand/20 bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-brand">
      {getPlanDisplayName(requiredPlan)}
    </span>
  );
}

export default function DashboardSidebar({
  userPlan,
  user,
  labels,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userPlan: PlanId;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  labels: SidebarLabels;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [statsOpen, setStatsOpen] = useState(pathname.startsWith("/dashboard/stats"));
  const { confirm, ConfirmDialogElement } = useConfirm();
  const isStatsSectionActive = pathname.startsWith("/dashboard/stats");

  useEffect(() => {
    if (isStatsSectionActive) setStatsOpen(true);
  }, [isStatsSectionActive]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  const userInitial = user.name?.charAt(0).toUpperCase() ?? "K";

  const isLocked = (key: FeatureKey) => {
    const required = FEATURE_PLAN_MAP[key];
    return !isPlanSufficient(userPlan, required);
  };

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: labels.signOutConfirmTitle,
      description: labels.signOutConfirmDescription,
      confirmLabel: labels.signOut,
      cancelLabel: labels.cancel,
      variant: "default",
    });

    if (!confirmed) return;

    await signOut({ callbackUrl: "/" });
  };

  const handleNavigate = (href: string) => {
    markDashboardNavigationStart(href);
    setOpenMobile(false);
  };

  return (
    <>
      {ConfirmDialogElement}

      <Sidebar collapsible="offcanvas" className="border-line" {...props}>
        <SidebarHeader className="border-b border-line px-3 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-10 rounded-lg px-2 text-ink hover:bg-ink-soft hover:text-ink data-[active=true]:bg-ink-soft"
              >
                <Link href="/dashboard" onClick={() => handleNavigate("/dashboard")}>
                  <span className="truncate text-lg font-semibold text-ink">
                    Kronoma
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-ink-muted">
              {labels.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const locked = isLocked(item.key);

                  if (item.key === "stats") {
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          type="button"
                          isActive={isStatsSectionActive}
                          tooltip={labels.items[item.key]}
                          onClick={() => setStatsOpen((current) => !current)}
                          className="h-9 rounded-lg text-ink-muted hover:bg-ink-soft hover:text-ink data-[active=true]:bg-ink-soft data-[active=true]:text-ink"
                        >
                          <Icon />
                          <span>{labels.items[item.key]}</span>
                          {locked ? (
                            <SidebarMenuBadge>
                              <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} />
                            </SidebarMenuBadge>
                          ) : null}
                          <ChevronRight
                            className={`ml-auto transition-transform ${
                              statsOpen ? "rotate-90" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                        {statsOpen ? (
                          <SidebarMenuSub>
                            {statsChildren.map((child) => {
                              const childActive = pathname.startsWith(child.href);

                              return (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={childActive}
                                    className="text-ink-muted hover:bg-ink-soft hover:text-ink data-[active=true]:bg-ink-soft data-[active=true]:text-ink"
                                  >
                                    <Link
                                      href={child.href}
                                      onClick={() => handleNavigate(child.href)}
                                    >
                                      <span>{labels.items[child.labelKey]}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        ) : null}
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={labels.items[item.key]}
                        className="h-9 rounded-lg text-ink-muted hover:bg-ink-soft hover:text-ink data-[active=true]:bg-ink-soft data-[active=true]:text-ink"
                      >
                        <Link href={item.href} onClick={() => handleNavigate(item.href)}>
                          <Icon />
                          <span>{labels.items[item.key]}</span>
                        </Link>
                      </SidebarMenuButton>
                      {locked ? (
                        <SidebarMenuBadge>
                          <PlanBadge requiredPlan={FEATURE_PLAN_MAP[item.key]} />
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs leading-5 text-ink-muted shadow-sm">
                {labels.hint}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-line p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="h-12 rounded-lg text-ink hover:bg-ink-soft data-[state=open]:bg-ink-soft"
                  >
                    <Avatar className="h-8 w-8 rounded-lg border border-line bg-white">
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name ?? "User avatar"} />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-brand/10 text-sm font-bold text-brand">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-sm font-medium">
                        {user.name ?? "Kronoma"}
                      </span>
                      <span className="truncate text-xs text-ink-muted">
                        {user.email ?? getPlanDisplayName(userPlan)}
                      </span>
                    </span>
                    <MoreVertical className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="end"
                  sideOffset={8}
                  className="w-56 rounded-lg border-line bg-white text-ink"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col">
                      <span className="truncate text-sm font-medium">
                        {user.name ?? "Kronoma"}
                      </span>
                      <span className="truncate text-xs text-ink-muted">
                        {getPlanDisplayName(userPlan)}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-ink"
                    onClick={() => {
                      handleNavigate("/dashboard/subscription");
                    }}
                    asChild
                  >
                    <Link href="/dashboard/subscription">
                      <CreditCard />
                      {labels.items.subscription}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-ink"
                    onClick={() => {
                      handleNavigate("/dashboard/settings");
                    }}
                    asChild
                  >
                    <Link href="/dashboard/settings">
                      <Settings2 />
                      {labels.items.settings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-red-50 focus:text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut />
                    {labels.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
