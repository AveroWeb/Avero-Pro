import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getDashboardOverview(organizationId: string) {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    activeClients,
    pendingQuotesCount,
    unpaidInvoicesCount,
    unpaidInvoicesAgg,
    overdueInvoicesList,
    expiringQuotesList,
    unansweredReviews,
    googleListing,
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.quote.count({ where: { organizationId, status: "SENT" } }),
    prisma.invoice.count({ where: { organizationId, status: { in: ["UNPAID", "OVERDUE"] } } }),
    prisma.invoice.aggregate({
      where: { organizationId, status: { in: ["UNPAID", "OVERDUE"] } },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: "UNPAID", dueDate: { lt: now } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.quote.findMany({
      where: { organizationId, status: "SENT", validUntil: { gte: now, lte: in14Days } },
      include: { client: true },
      orderBy: { validUntil: "asc" },
      take: 5,
    }),
    prisma.review.findMany({
      where: { organizationId, respondedAt: null },
      orderBy: { receivedAt: "desc" },
      take: 5,
    }),
    prisma.googleListing.findUnique({ where: { organizationId } }),
  ]);

  return {
    kpis: {
      activeClients,
      pendingQuotesCount,
      unpaidInvoicesCount,
      unpaidAmount: toNumber(unpaidInvoicesAgg._sum.amount),
      googleRating: googleListing?.rating ? toNumber(googleListing.rating) : null,
      googleReviewCount: googleListing?.reviewCount ?? 0,
      unansweredReviewsCount: unansweredReviews.length,
    },
    alerts: {
      overdueInvoices: overdueInvoicesList,
      expiringQuotes: expiringQuotesList,
      unansweredReviews,
    },
  };
}

export type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;
