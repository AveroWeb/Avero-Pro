import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { computeInvoicePaymentState } from "@/lib/payments";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function getDashboardOverview(organizationId: string) {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    activeClients,
    pendingQuotesCount,
    openInvoices,
    expiringQuotesList,
    unansweredReviews,
    googleListing,
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.quote.count({ where: { organizationId, status: "SENT" } }),
    prisma.invoice.findMany({
      where: { organizationId, status: { in: ["UNPAID", "OVERDUE", "PARTIAL"] } },
      include: { client: true, payments: { select: { amount: true } } },
      orderBy: { dueDate: "asc" },
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

  let unpaidAmount = 0;
  const overdueInvoices: Array<(typeof openInvoices)[number] & { remaining: number }> = [];
  for (const invoice of openInvoices) {
    const state = computeInvoicePaymentState(invoice, now);
    unpaidAmount += state.remaining;
    if (state.isOverdue) overdueInvoices.push({ ...invoice, remaining: state.remaining });
  }

  return {
    kpis: {
      activeClients,
      pendingQuotesCount,
      unpaidInvoicesCount: openInvoices.length,
      unpaidAmount: round2(unpaidAmount),
      googleRating: googleListing?.rating ? toNumber(googleListing.rating) : null,
      googleReviewCount: googleListing?.reviewCount ?? 0,
      unansweredReviewsCount: unansweredReviews.length,
    },
    alerts: {
      overdueInvoices: overdueInvoices.slice(0, 5),
      expiringQuotes: expiringQuotesList,
      unansweredReviews,
    },
  };
}

export type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;
