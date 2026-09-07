"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { allocateDocumentNumber } from "@/lib/numbering";
import { DocumentKind } from "@/generated/prisma/enums";
import { invoiceSchema } from "@/lib/validation/invoice";
import { lineItemsSchema, computeLineItemsTotal } from "@/lib/validation/line-items";

function toDate(value: string) {
  return value ? new Date(value) : null;
}

export async function createInvoiceAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireStaff();

  let clientId: string;
  try {
    clientId = String(formData.get("clientId") ?? "");
    if (!clientId) return "Le client est requis.";

    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: user.organizationId } });
    if (!client) return "Client introuvable.";

    const data = invoiceSchema.parse(Object.fromEntries(formData));

    let lineItemsRaw: unknown;
    try {
      lineItemsRaw = JSON.parse(String(formData.get("lineItems") ?? "[]"));
    } catch {
      return "Lignes invalides.";
    }
    const lineItemsResult = lineItemsSchema.safeParse(lineItemsRaw);
    if (!lineItemsResult.success) return lineItemsResult.error.issues[0]?.message ?? "Lignes invalides.";
    const lineItems = lineItemsResult.data;

    const issueDate = toDate(data.issueDate) ?? new Date();
    await prisma.$transaction(async (tx) => {
      const number = await allocateDocumentNumber(tx, user.organizationId, DocumentKind.INVOICE, issueDate);
      await tx.invoice.create({
        data: {
          organizationId: user.organizationId,
          clientId,
          number,
          title: data.title || null,
          amount: computeLineItemsTotal(lineItems),
          status: data.status,
          issueDate,
          dueDate: toDate(data.dueDate ?? ""),
          paidAt: data.status === "PAID" ? new Date() : null,
          notes: data.notes || null,
          lineItems: { create: lineItems.map((item, index) => ({ position: index, ...item })) },
        },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? "Données invalides.";
    }
    throw error;
  }

  revalidatePath("/invoices");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
