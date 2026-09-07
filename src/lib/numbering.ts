import type { Prisma } from "@/generated/prisma/client";
import { DocumentKind } from "@/generated/prisma/enums";

const PREFIXES: Record<DocumentKind, string> = {
  [DocumentKind.QUOTE]: "DEV",
  [DocumentKind.INVOICE]: "FAC",
  [DocumentKind.CREDIT_NOTE]: "AV",
};

/**
 * Allocates the next legal document number for an organization, e.g. `FAC-2026-0001`.
 *
 * The sequence is continuous per organization, per document kind and per calendar
 * year. Allocation happens inside the caller's interactive transaction so it is
 * atomic with the row it numbers. Concurrent allocations are serialized by the
 * `@@unique([organizationId, kind, year])` constraint on `NumberSequence`
 * (Postgres runs the upsert as `INSERT ... ON CONFLICT DO UPDATE`).
 */
export async function allocateDocumentNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
  kind: DocumentKind,
  date: Date = new Date(),
): Promise<string> {
  const year = date.getFullYear();

  const sequence = await tx.numberSequence.upsert({
    where: { organizationId_kind_year: { organizationId, kind, year } },
    create: { organizationId, kind, year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });

  const serial = String(sequence.lastValue).padStart(4, "0");
  return `${PREFIXES[kind]}-${year}-${serial}`;
}
