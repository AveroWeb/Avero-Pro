import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getInvoiceSummary(organizationId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [billedThisMonth, paidThisMonth, unpaidAgg, overdueAgg] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organizationId, issueDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: "UNPAID" },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: "UNPAID", dueDate: { lt: now } },
      _sum: { amount: true },
    }),
  ]);

  return {
    billedThisMonth: toNumber(billedThisMonth._sum.amount),
    paidThisMonth: toNumber(paidThisMonth._sum.amount),
    unpaid: toNumber(unpaidAgg._sum.amount),
    overdue: toNumber(overdueAgg._sum.amount),
  };
}

export async function listInvoices(organizationId: string) {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    include: { client: true },
    orderBy: { issueDate: "desc" },
  });
  return invoices.map((invoice) => ({
    ...invoice,
    isOverdue: invoice.status === "UNPAID" && !!invoice.dueDate && invoice.dueDate < now,
  }));
}

export async function getInvoice(organizationId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      client: true,
      organization: true,
      quote: true,
      lineItems: { orderBy: { position: "asc" } },
    },
  });
}
