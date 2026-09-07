import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getOrganizationBilling(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return null;
  return { ...org, vatRate: toNumber(org.vatRate) };
}
