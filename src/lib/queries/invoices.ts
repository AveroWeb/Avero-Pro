import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { computeInvoicePaymentState, effectiveInvoiceStatus } from "@/lib/payments";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function getInvoiceSummary(organizationId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [billedAgg, paidThisMonthAgg, openInvoices] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organizationId, issueDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { organizationId, receivedAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: { notIn: ["PAID", "CREDITED", "CANCELLED"] } },
      select: { amount: true, status: true, dueDate: true, payments: { select: { amount: true } } },
    }),
  ]);

  let unpaid = 0;
  let overdue = 0;
  for (const invoice of openInvoices) {
    const state = computeInvoicePaymentState(invoice, now);
    unpaid += state.remaining;
    if (state.isOverdue) overdue += state.remaining;
  }

  return {
    billedThisMonth: toNumber(billedAgg._sum.amount),
    paidThisMonth: toNumber(paidThisMonthAgg._sum.amount),
    unpaid: round2(unpaid),
    overdue: round2(overdue),
  };
}

export async function listInvoices(organizationId: string) {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    include: { client: true, payments: true },
    orderBy: { issueDate: "desc" },
  });
  return invoices.map((invoice) => {
    const state = computeInvoicePaymentState(invoice, now);
    return {
      ...invoice,
      paidAmount: state.paid,
      remaining: state.remaining,
      isOverdue: state.isOverdue,
      effectiveStatus: effectiveInvoiceStatus(invoice, now),
    };
  });
}

export async function getInvoice(organizationId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      client: true,
      organization: true,
      quote: true,
      lineItems: { orderBy: { position: "asc" } },
      payments: { orderBy: { receivedAt: "asc" } },
      creditNotes: { orderBy: { issueDate: "asc" } },
    },
  });
}
