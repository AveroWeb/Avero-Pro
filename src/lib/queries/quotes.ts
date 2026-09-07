import { prisma } from "@/lib/prisma";

export async function listQuotes(organizationId: string) {
  return prisma.quote.findMany({
    where: { organizationId },
    include: { client: true, invoice: true },
    orderBy: { issueDate: "desc" },
  });
}

export async function getQuote(organizationId: string, quoteId: string) {
  return prisma.quote.findFirst({
    where: { id: quoteId, organizationId },
    include: { client: true, organization: true, lineItems: { orderBy: { position: "asc" } } },
  });
}
