"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { invoiceSchema } from "@/lib/validation/invoice";
import { quoteSchema } from "@/lib/validation/quote";
import { lineItemsSchema, computeLineItemsTotal, type LineItemValues } from "@/lib/validation/line-items";

function parseLineItems(formData: FormData): LineItemValues[] {
  const raw = formData.get("lineItems");
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? "[]"));
  } catch {
    throw new Error("Lignes invalides.");
  }
  const result = lineItemsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Lignes invalides.");
  }
  return result.data;
}

function toDate(value: string) {
  return value ? new Date(value) : null;
}

async function assertClientOwnership(organizationId: string, clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId }, select: { id: true } });
  if (!client) throw new Error("Client introuvable.");
}

// --- Invoices ----------------------------------------------------------------

export async function saveInvoiceAction(invoiceId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = invoiceSchema.parse(Object.fromEntries(formData));
  const lineItems = parseLineItems(formData);
  await assertClientOwnership(user.organizationId, clientId);

  const amount = computeLineItemsTotal(lineItems);
  const payload = {
    clientId,
    title: data.title || null,
    amount,
    status: data.status,
    issueDate: toDate(data.issueDate) ?? new Date(),
    dueDate: toDate(data.dueDate ?? ""),
    notes: data.notes || null,
  };

  if (invoiceId) {
    const existing = await prisma.invoice.findFirst({ where: { id: invoiceId, organizationId: user.organizationId } });
    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { ...payload, paidAt: data.status === "PAID" ? (existing?.paidAt ?? new Date()) : null },
      }),
      prisma.invoiceLineItem.deleteMany({ where: { invoiceId } }),
      prisma.invoiceLineItem.createMany({
        data: lineItems.map((item, index) => ({ invoiceId, position: index, ...item })),
      }),
    ]);
  } else {
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: user.organizationId,
        ...payload,
        paidAt: data.status === "PAID" ? new Date() : null,
        lineItems: { create: lineItems.map((item, index) => ({ position: index, ...item })) },
      },
    });
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "INVOICE_CREATED",
        message: `Facture créée : ${invoice.title ?? "sans titre"}.`,
      },
    });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function deleteInvoiceAction(clientId: string, invoiceId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function markInvoicePaidAction(clientId: string, invoiceId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      userId: user.id,
      type: "PAYMENT_RECEIVED",
      message: `Facture de ${invoice.amount.toString()} € payée.`,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

// --- Quotes (devis) ------------------------------------------------------------

export async function saveQuoteAction(quoteId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = quoteSchema.parse(Object.fromEntries(formData));
  const lineItems = parseLineItems(formData);
  await assertClientOwnership(user.organizationId, clientId);

  const amount = computeLineItemsTotal(lineItems);
  const payload = {
    clientId,
    title: data.title,
    amount,
    status: data.status,
    issueDate: toDate(data.issueDate) ?? new Date(),
    validUntil: toDate(data.validUntil ?? ""),
    notes: data.notes || null,
  };

  if (quoteId) {
    await prisma.$transaction([
      prisma.quote.update({ where: { id: quoteId }, data: payload }),
      prisma.quoteLineItem.deleteMany({ where: { quoteId } }),
      prisma.quoteLineItem.createMany({
        data: lineItems.map((item, index) => ({ quoteId, position: index, ...item })),
      }),
    ]);
    if (data.status === "SENT") {
      await prisma.activityLog.create({
        data: {
          organizationId: user.organizationId,
          clientId,
          userId: user.id,
          type: "QUOTE_SENT",
          message: `Devis envoyé : ${data.title}.`,
        },
      });
    }
  } else {
    await prisma.quote.create({
      data: {
        organizationId: user.organizationId,
        ...payload,
        lineItems: { create: lineItems.map((item, index) => ({ position: index, ...item })) },
      },
    });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/quotes");
}

export async function deleteQuoteAction(clientId: string, quoteId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.quote.delete({ where: { id: quoteId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/quotes");
}

export async function convertQuoteToInvoiceAction(clientId: string, quoteId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: user.organizationId },
    include: { invoice: true, lineItems: { orderBy: { position: "asc" } } },
  });
  if (!quote) throw new Error("Devis introuvable.");
  if (quote.invoice) throw new Error("Ce devis a déjà été converti en facture.");

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 15);

  await prisma.$transaction([
    prisma.invoice.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        quoteId: quote.id,
        title: quote.title,
        amount: quote.amount,
        status: "UNPAID",
        issueDate,
        dueDate,
        notes: `Généré depuis le devis "${quote.title}".`,
        lineItems: {
          create: quote.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            position: item.position,
          })),
        },
      },
    }),
    prisma.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } }),
  ]);

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      userId: user.id,
      type: "QUOTE_ACCEPTED",
      message: `Devis "${quote.title}" converti en facture.`,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/quotes");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}
