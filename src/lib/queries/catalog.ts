import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export type CatalogOption = {
  id: string;
  label: string;
  description: string | null;
  unitPrice: number;
  unit: string | null;
};

export async function listCatalogItems(organizationId: string) {
  return prisma.catalogItem.findMany({
    where: { organizationId },
    orderBy: [{ active: "desc" }, { label: "asc" }],
  });
}

export async function listCatalogItemOptions(organizationId: string): Promise<CatalogOption[]> {
  const items = await prisma.catalogItem.findMany({
    where: { organizationId, active: true },
    orderBy: { label: "asc" },
    select: { id: true, label: true, description: true, unitPrice: true, unit: true },
  });
  return items.map((item) => ({ ...item, unitPrice: toNumber(item.unitPrice) }));
}
