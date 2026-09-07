"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { catalogItemSchema } from "@/lib/validation/catalog-item";

export async function saveCatalogItemAction(itemId: string | null, formData: FormData) {
  const user = await requireStaff();

  let data;
  try {
    data = catalogItemSchema.parse(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0]?.message ?? "Données invalides.");
    }
    throw error;
  }

  const payload = {
    label: data.label,
    description: data.description || null,
    unitPrice: data.unitPrice,
    unit: data.unit || null,
    active: data.active !== "false",
  };

  if (itemId) {
    const existing = await prisma.catalogItem.findFirst({
      where: { id: itemId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!existing) throw new Error("Article introuvable.");
    await prisma.catalogItem.update({ where: { id: itemId }, data: payload });
  } else {
    await prisma.catalogItem.create({ data: { organizationId: user.organizationId, ...payload } });
  }

  revalidatePath("/catalog");
}

export async function deleteCatalogItemAction(itemId: string) {
  const user = await requireStaff();
  const item = await prisma.catalogItem.findFirst({
    where: { id: itemId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!item) throw new Error("Article introuvable.");

  await prisma.catalogItem.delete({ where: { id: itemId } });
  revalidatePath("/catalog");
}
