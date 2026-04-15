import { cache } from "react";
import { Prisma } from "@prisma/client";

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

type RevenuePointRow = {
  key: string;
  total: number | string | null;
  paid: number | string | null;
  pending: number | string | null;
  count: number | bigint;
};

type EntityStatRow = {
  name: string | null;
  total: number | string | null;
  paid: number | string | null;
  count: number | bigint;
};

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

const toCount = (value: number | bigint) => Number(value);

const mergeRevenuePoints = (
  points: BillingRevenuePoint[],
  rows: RevenuePointRow[]
) => {
  const byKey = new Map(points.map((point) => [point.key, point]));

  for (const row of rows) {
    const point = byKey.get(row.key);
    if (!point) {
      continue;
    }

    point.total = toNumber(row.total);
    point.paid = toNumber(row.paid);
    point.pending = toNumber(row.pending);
    point.count = toCount(row.count);
  }

  return points;
};

const toEntityStat = (row: EntityStatRow): BillingEntityStat => ({
  name: row.name ?? "__NO_CLIENT__",
  total: toNumber(row.total),
  paid: toNumber(row.paid),
  count: toCount(row.count),
});

export const getBillingStats = cache(async function getBillingStats(
  userId: string
): Promise<BillingStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const dayStart = startOfDay(now);
  const dailyWindowStart = new Date(dayStart);
  dailyWindowStart.setDate(dayStart.getDate() - 13);
  const monthlyWindowStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 11, 1)
  );
  const yearlyWindowStart = new Date(now.getFullYear() - 4, 0, 1);

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

  const [
    summaryAgg,
    paidAgg,
    monthAgg,
    yearAgg,
    statusRows,
    dailyRows,
    monthlyRows,
    yearlyRows,
    topClientRows,
    topProjectRows,
    clientCountRows,
    clientPaymentPoints,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { userId },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: "PAID" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, issueDate: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, issueDate: { gte: yearStart } },
      _sum: { total: true },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { userId },
      _sum: { total: true },
      _count: { status: true },
    }),
    prisma.$queryRaw<RevenuePointRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "issueDate"), 'YYYY-MM-DD') AS key,
        SUM("total") AS total,
        SUM(CASE WHEN "status" = 'PAID' THEN "total" ELSE 0 END) AS paid,
        SUM(CASE WHEN "status" <> 'PAID' THEN "total" ELSE 0 END) AS pending,
        COUNT(*)::int AS count
      FROM "Invoice"
      WHERE "userId" = ${userId}
        AND "issueDate" >= ${dailyWindowStart}
      GROUP BY 1
    `),
    prisma.$queryRaw<RevenuePointRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "issueDate"), 'YYYY-MM') AS key,
        SUM("total") AS total,
        SUM(CASE WHEN "status" = 'PAID' THEN "total" ELSE 0 END) AS paid,
        SUM(CASE WHEN "status" <> 'PAID' THEN "total" ELSE 0 END) AS pending,
        COUNT(*)::int AS count
      FROM "Invoice"
      WHERE "userId" = ${userId}
        AND "issueDate" >= ${monthlyWindowStart}
      GROUP BY 1
    `),
    prisma.$queryRaw<RevenuePointRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('year', "issueDate"), 'YYYY') AS key,
        SUM("total") AS total,
        SUM(CASE WHEN "status" = 'PAID' THEN "total" ELSE 0 END) AS paid,
        SUM(CASE WHEN "status" <> 'PAID' THEN "total" ELSE 0 END) AS pending,
        COUNT(*)::int AS count
      FROM "Invoice"
      WHERE "userId" = ${userId}
        AND "issueDate" >= ${yearlyWindowStart}
      GROUP BY 1
    `),
    prisma.$queryRaw<EntityStatRow[]>(Prisma.sql`
      SELECT
        MAX(COALESCE(NULLIF(BTRIM("clientName"), ''), '__NO_CLIENT__')) AS name,
        SUM("total") AS total,
        SUM(CASE WHEN "status" = 'PAID' THEN "total" ELSE 0 END) AS paid,
        COUNT(*)::int AS count
      FROM "Invoice"
      WHERE "userId" = ${userId}
      GROUP BY COALESCE(
        "clientId",
        CONCAT('snapshot:', LOWER(COALESCE(NULLIF(BTRIM("clientName"), ''), '__NO_CLIENT__')))
      )
      ORDER BY SUM("total") DESC
      LIMIT 5
    `),
    prisma.$queryRaw<EntityStatRow[]>(Prisma.sql`
      SELECT
        MAX(COALESCE(NULLIF(BTRIM("Project"."name"), ''), '__NO_PROJECT__')) AS name,
        SUM("Invoice"."total") AS total,
        SUM(CASE WHEN "Invoice"."status" = 'PAID' THEN "Invoice"."total" ELSE 0 END) AS paid,
        COUNT(*)::int AS count
      FROM "Invoice"
      LEFT JOIN "Project" ON "Project"."id" = "Invoice"."projectId"
      WHERE "Invoice"."userId" = ${userId}
      GROUP BY COALESCE(
        "Invoice"."projectId",
        CONCAT('snapshot:', LOWER(COALESCE(NULLIF(BTRIM("Project"."name"), ''), '__NO_PROJECT__')))
      )
      ORDER BY SUM("Invoice"."total") DESC
      LIMIT 5
    `),
    prisma.$queryRaw<Array<{ count: number | bigint }>>(Prisma.sql`
      SELECT
        COUNT(
          DISTINCT COALESCE(
            "clientId",
            CONCAT('snapshot:', LOWER(COALESCE(NULLIF(BTRIM("clientName"), ''), '__NO_CLIENT__')))
          )
        )::int AS count
      FROM "Invoice"
      WHERE "userId" = ${userId}
    `),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { issueDate: "asc" },
      select: {
        clientName: true,
        issueDate: true,
        total: true,
        status: true,
        project: { select: { name: true } },
      },
    }),
  ]);

  const totalInvoiced = toNumber(summaryAgg._sum.total);
  const totalPaid = toNumber(paidAgg._sum.total);
  const totalPending = totalInvoiced - totalPaid;

  return {
    summary: {
      thisMonthTotal: toNumber(monthAgg._sum.total),
      thisYearTotal: toNumber(yearAgg._sum.total),
      totalInvoiced,
      totalPaid,
      totalPending,
      averageInvoice: summaryAgg._count.id ? totalInvoiced / summaryAgg._count.id : 0,
      invoiceCount: summaryAgg._count.id,
      clientsCount: toCount(clientCountRows[0]?.count ?? 0),
    },
    dailyPoints: mergeRevenuePoints(dailyPoints, dailyRows),
    monthlyPoints: mergeRevenuePoints(monthlyPoints, monthlyRows),
    yearlyPoints: mergeRevenuePoints(yearlyPoints, yearlyRows),
    statusBreakdown: (["DRAFT", "SENT", "PAID"] as const).map((status) => {
      const row = statusRows.find((entry) => entry.status === status);

      return {
        status,
        total: toNumber(row?._sum.total),
        count: row?._count.status ?? 0,
      };
    }),
    topClients: topClientRows.map((row) => ({
      ...toEntityStat(row),
      name: row.name ?? "__NO_CLIENT__",
    })),
    topProjects: topProjectRows.map((row) => ({
      ...toEntityStat(row),
      name: row.name ?? "__NO_PROJECT__",
    })),
    clientPaymentPoints: clientPaymentPoints.map((invoice) => ({
      clientName: invoice.clientName?.trim() || "__NO_CLIENT__",
      projectName: invoice.project?.name?.trim() || "__NO_PROJECT__",
      issueDate: new Date(invoice.issueDate).toISOString(),
      total: Number(invoice.total ?? 0),
      status: invoice.status,
    })),
  };
});
