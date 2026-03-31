import { prisma } from "@/server/prisma";

export type BillingRevenuePoint = {
  key: string;
  total: number;
  paid: number;
  pending: number;
  count: number;
};

export type BillingStatusBreakdown = {
  status: "DRAFT" | "SENT" | "PAID";
  total: number;
  count: number;
};

export type BillingEntityStat = {
  name: string;
  total: number;
  paid: number;
  count: number;
};

export type BillingClientPaymentPoint = {
  clientName: string;
  projectName: string;
  issueDate: string;
  total: number;
  status: "DRAFT" | "SENT" | "PAID";
};

export type BillingStats = {
  summary: {
    thisMonthTotal: number;
    thisYearTotal: number;
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    averageInvoice: number;
    invoiceCount: number;
    clientsCount: number;
  };
  dailyPoints: BillingRevenuePoint[];
  monthlyPoints: BillingRevenuePoint[];
  yearlyPoints: BillingRevenuePoint[];
  statusBreakdown: BillingStatusBreakdown[];
  topClients: BillingEntityStat[];
  topProjects: BillingEntityStat[];
  clientPaymentPoints: BillingClientPaymentPoint[];
};

const pad = (value: number) => String(value).padStart(2, "0");

const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

const createRevenuePoint = (key: string): BillingRevenuePoint => ({
  key,
  total: 0,
  paid: 0,
  pending: 0,
  count: 0,
});

export async function getBillingStats(userId: string): Promise<BillingStats> {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { issueDate: "asc" },
    select: {
      total: true,
      status: true,
      issueDate: true,
      clientId: true,
      clientName: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const dailyPoints = Array.from({ length: 14 }, (_, index) => {
    const date = startOfDay(now);
    date.setDate(date.getDate() - (13 - index));
    return createRevenuePoint(toDayKey(date));
  });
  const monthlyPoints = Array.from({ length: 12 }, (_, index) => {
    const date = startOfMonth(now);
    date.setMonth(date.getMonth() - (11 - index));
    return createRevenuePoint(toMonthKey(date));
  });
  const yearlyPoints = Array.from({ length: 5 }, (_, index) =>
    createRevenuePoint(String(now.getFullYear() - (4 - index)))
  );

  const dailyMap = new Map(dailyPoints.map((point) => [point.key, point]));
  const monthlyMap = new Map(monthlyPoints.map((point) => [point.key, point]));
  const yearlyMap = new Map(yearlyPoints.map((point) => [point.key, point]));

  const statusMap = new Map<BillingStatusBreakdown["status"], BillingStatusBreakdown>(
    [
      ["DRAFT", { status: "DRAFT", total: 0, count: 0 }],
      ["SENT", { status: "SENT", total: 0, count: 0 }],
      ["PAID", { status: "PAID", total: 0, count: 0 }],
    ]
  );

  const clientTotals = new Map<string, BillingEntityStat>();
  const projectTotals = new Map<string, BillingEntityStat>();

  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let thisMonthTotal = 0;
  let thisYearTotal = 0;

  for (const invoice of invoices) {
    const amount = Number(invoice.total ?? 0);
    const issueDate = new Date(invoice.issueDate);
    const isPaid = invoice.status === "PAID";

    totalInvoiced += amount;
    if (isPaid) {
      totalPaid += amount;
    } else {
      totalPending += amount;
    }

    if (issueDate >= monthStart) {
      thisMonthTotal += amount;
    }
    if (issueDate >= yearStart) {
      thisYearTotal += amount;
    }

    const statusEntry = statusMap.get(invoice.status);
    if (statusEntry) {
      statusEntry.total += amount;
      statusEntry.count += 1;
    }

    const dayPoint = dailyMap.get(toDayKey(issueDate));
    if (dayPoint) {
      dayPoint.total += amount;
      dayPoint.count += 1;
      if (isPaid) {
        dayPoint.paid += amount;
      } else {
        dayPoint.pending += amount;
      }
    }

    const monthPoint = monthlyMap.get(toMonthKey(issueDate));
    if (monthPoint) {
      monthPoint.total += amount;
      monthPoint.count += 1;
      if (isPaid) {
        monthPoint.paid += amount;
      } else {
        monthPoint.pending += amount;
      }
    }

    const yearPoint = yearlyMap.get(String(issueDate.getFullYear()));
    if (yearPoint) {
      yearPoint.total += amount;
      yearPoint.count += 1;
      if (isPaid) {
        yearPoint.paid += amount;
      } else {
        yearPoint.pending += amount;
      }
    }

    const clientName = invoice.clientName?.trim() || "__NO_CLIENT__";
    const clientKey = invoice.clientId ?? `snapshot:${clientName.toLowerCase()}`;
    const clientEntry = clientTotals.get(clientKey) ?? {
      name: clientName,
      total: 0,
      paid: 0,
      count: 0,
    };
    clientEntry.total += amount;
    clientEntry.count += 1;
    if (isPaid) {
      clientEntry.paid += amount;
    }
    clientTotals.set(clientKey, clientEntry);

    const projectName = invoice.project?.name?.trim() || "__NO_PROJECT__";
    const projectKey = invoice.projectId ?? `snapshot:${projectName.toLowerCase()}`;
    const projectEntry = projectTotals.get(projectKey) ?? {
      name: projectName,
      total: 0,
      paid: 0,
      count: 0,
    };
    projectEntry.total += amount;
    projectEntry.count += 1;
    if (isPaid) {
      projectEntry.paid += amount;
    }
    projectTotals.set(projectKey, projectEntry);
  }

  return {
    summary: {
      thisMonthTotal,
      thisYearTotal,
      totalInvoiced,
      totalPaid,
      totalPending,
      averageInvoice: invoices.length ? totalInvoiced / invoices.length : 0,
      invoiceCount: invoices.length,
      clientsCount: clientTotals.size,
    },
    dailyPoints,
    monthlyPoints,
    yearlyPoints,
    statusBreakdown: Array.from(statusMap.values()),
    topClients: Array.from(clientTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    topProjects: Array.from(projectTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    clientPaymentPoints: invoices.map((invoice) => ({
      clientName: invoice.clientName?.trim() || "__NO_CLIENT__",
      projectName: invoice.project?.name?.trim() || "__NO_PROJECT__",
      issueDate: new Date(invoice.issueDate).toISOString(),
      total: Number(invoice.total ?? 0),
      status: invoice.status,
    })),
  };
}
