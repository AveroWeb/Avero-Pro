import { prisma } from "@/lib/prisma";

export async function listCreditNotes(organizationId: string) {
  return prisma.creditNote.findMany({
    where: { organizationId },
    include: { client: true, invoice: { select: { id: true, number: true } } },
    orderBy: { issueDate: "desc" },
  });
}

export async function getCreditNote(organizationId: string, creditNoteId: string) {
  return prisma.creditNote.findFirst({
    where: { id: creditNoteId, organizationId },
    include: {
      client: true,
      organization: true,
      invoice: { select: { number: true, issueDate: true } },
      lineItems: { orderBy: { position: "asc" } },
    },
  });
}
