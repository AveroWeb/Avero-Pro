import { prisma } from "@/lib/prisma";

export async function listClients(organizationId: string, query?: string) {
  const trimmed = query?.trim();

  return prisma.client.findMany({
    where: {
      organizationId,
      ...(trimmed
        ? {
            OR: [
              { companyName: { contains: trimmed, mode: "insensitive" } },
              { contactName: { contains: trimmed, mode: "insensitive" } },
              { email: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      invoices: {
        where: { status: { in: ["UNPAID", "OVERDUE", "PARTIAL"] } },
        select: { amount: true, payments: { select: { amount: true } } },
      },
      quotes: {
        where: { status: "SENT" },
        select: { id: true },
      },
    },
    orderBy: { companyName: "asc" },
  });
}

export type ClientListItem = Awaited<ReturnType<typeof listClients>>[number];

export async function listClientOptions(organizationId: string) {
  return prisma.client.findMany({
    where: { organizationId },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });
}

export async function getClientDetail(organizationId: string, clientId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, organizationId },
    include: {
      invoices: {
        include: {
          lineItems: { orderBy: { position: "asc" } },
          payments: { orderBy: { receivedAt: "asc" } },
          creditNotes: { orderBy: { issueDate: "asc" } },
        },
        orderBy: { issueDate: "desc" },
      },
      quotes: {
        include: { invoice: true, lineItems: { orderBy: { position: "asc" } } },
        orderBy: { issueDate: "desc" },
      },
      creditNotes: {
        include: { invoice: { select: { number: true } }, lineItems: { orderBy: { position: "asc" } } },
        orderBy: { issueDate: "desc" },
      },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 30, include: { user: true } },
    },
  });
}

export type ClientDetail = NonNullable<Awaited<ReturnType<typeof getClientDetail>>>;
