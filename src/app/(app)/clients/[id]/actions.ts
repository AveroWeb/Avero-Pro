"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { allocateDocumentNumber } from "@/lib/numbering";
import { DocumentKind } from "@/generated/prisma/enums";
import { invoiceSchema } from "@/lib/validation/invoice";
import { quoteSchema } from "@/lib/validation/quote";
import { paymentSchema } from "@/lib/validation/payment";
import { creditNoteSchema } from "@/lib/validation/credit-note";
import { lineItemsSchema, computeLineItemsTotal, type LineItemValues } from "@/lib/validation/line-items";

/**
 * Recomputes an invoice's stored status/paidAt from its payments and credit
 * notes. Call inside the same transaction as the change that triggered it.
 * `fallbackStatus` is only used when there is neither a payment nor a credit
 * note, so a manual "Payée" / "En retard" choice from the edit form is kept.
 */
async function syncInvoiceStatusAfterChange(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  fallbackStatus?: string,
) {
  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true, creditNotes: { select: { amount: true } } },
  });
  const amount = Number(invoice.amount);
  const credited = invoice.creditNotes.reduce((sum, c) => sum + Number(c.amount), 0);
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  let status: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE" | "CREDITED";
  let paidAt: Date | null = null;
  if (amount > 0 && credited >= amount) {
    status = "CREDITED";
  } else if (amount > 0 && paid >= amount) {
    status = "PAID";
    paidAt = invoice.payments.reduce<Date | null>(
      (latest, p) => (!latest || p.receivedAt > latest ? p.receivedAt : latest),
      null,
    );
  } else if (paid > 0) {
    status = "PARTIAL";
  } else if (fallbackStatus === "PAID") {
    status = "PAID";
    paidAt = new Date();
  } else if (fallbackStatus === "OVERDUE") {
    status = "OVERDUE";
  } else {
    status = "UNPAID";
  }
  await tx.invoice.update({ where: { id: invoiceId }, data: { status, paidAt } });
}

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
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!existing) throw new Error("Facture introuvable.");
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: invoiceId }, data: payload });
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId } });
      await tx.invoiceLineItem.createMany({
        data: lineItems.map((item, index) => ({ invoiceId, position: index, ...item })),
      });
      await syncInvoiceStatusAfterChange(tx, invoiceId, data.status);
    });
  } else {
    await prisma.$transaction(async (tx) => {
      const number = await allocateDocumentNumber(tx, user.organizationId, DocumentKind.INVOICE, payload.issueDate);
      const invoice = await tx.invoice.create({
        data: {
          organizationId: user.organizationId,
          number,
          ...payload,
          status: "UNPAID",
          lineItems: { create: lineItems.map((item, index) => ({ position: index, ...item })) },
        },
      });
      await syncInvoiceStatusAfterChange(tx, invoice.id, data.status);
      await tx.activityLog.create({
        data: {
          organizationId: user.organizationId,
          clientId,
          userId: user.id,
          type: "INVOICE_CREATED",
          message: `Facture ${invoice.number} créée${invoice.title ? ` : ${invoice.title}` : ""}.`,
        },
      });
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

async function loadOwnedInvoice(organizationId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: { payments: { select: { amount: true } } },
  });
  if (!invoice) throw new Error("Facture introuvable.");
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Math.round((Number(invoice.amount) - paid) * 100) / 100);
  return { invoice, paid, remaining };
}

/** Records a payment (full or partial) against an invoice. */
export async function recordPaymentAction(clientId: string, invoiceId: string, formData: FormData) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  const data = paymentSchema.parse(Object.fromEntries(formData));

  const { invoice, remaining } = await loadOwnedInvoice(user.organizationId, invoiceId);
  if (data.amount - remaining > 0.01) {
    throw new Error(`Le montant dépasse le reste dû (${remaining.toFixed(2)} €).`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        organizationId: user.organizationId,
        invoiceId,
        amount: data.amount,
        method: data.method,
        receivedAt: new Date(data.receivedAt),
        note: data.note || null,
      },
    });
    await syncInvoiceStatusAfterChange(tx, invoiceId);
    await tx.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "PAYMENT_RECEIVED",
        message: `Paiement de ${data.amount.toFixed(2)} € sur la facture ${invoice.number}.`,
      },
    });
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function deletePaymentAction(clientId: string, paymentId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId: user.organizationId },
  });
  if (!payment) throw new Error("Paiement introuvable.");

  await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id: paymentId } });
    await syncInvoiceStatusAfterChange(tx, payment.invoiceId);
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

/** Shortcut: settles an invoice by recording a payment for the remaining balance. */
export async function markInvoicePaidAction(clientId: string, invoiceId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const { invoice, remaining } = await loadOwnedInvoice(user.organizationId, invoiceId);

  await prisma.$transaction(async (tx) => {
    if (remaining > 0) {
      await tx.payment.create({
        data: {
          organizationId: user.organizationId,
          invoiceId,
          amount: remaining,
          method: "TRANSFER",
          receivedAt: new Date(),
        },
      });
    }
    await syncInvoiceStatusAfterChange(tx, invoiceId);
    await tx.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "PAYMENT_RECEIVED",
        message: `Facture ${invoice.number} soldée${remaining > 0 ? ` (${remaining.toFixed(2)} €)` : ""}.`,
      },
    });
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
    await prisma.$transaction(async (tx) => {
      const number = await allocateDocumentNumber(tx, user.organizationId, DocumentKind.QUOTE, payload.issueDate);
      await tx.quote.create({
        data: {
          organizationId: user.organizationId,
          number,
          ...payload,
          lineItems: { create: lineItems.map((item, index) => ({ position: index, ...item })) },
        },
      });
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

  await prisma.$transaction(async (tx) => {
    const number = await allocateDocumentNumber(tx, user.organizationId, DocumentKind.INVOICE, issueDate);
    const invoice = await tx.invoice.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        quoteId: quote.id,
        number,
        title: quote.title,
        amount: quote.amount,
        status: "UNPAID",
        issueDate,
        dueDate,
        notes: `Généré depuis le devis ${quote.number} "${quote.title}".`,
        lineItems: {
          create: quote.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            position: item.position,
          })),
        },
      },
    });
    await tx.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } });
    await tx.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "QUOTE_ACCEPTED",
        message: `Devis ${quote.number} "${quote.title}" converti en facture ${invoice.number}.`,
      },
    });
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/quotes");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

// --- Credit notes (avoirs) ---------------------------------------------------

export async function createCreditNoteAction(clientId: string, invoiceId: string, formData: FormData) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  const data = creditNoteSchema.parse(Object.fromEntries(formData));

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: { lineItems: { orderBy: { position: "asc" } }, creditNotes: { select: { amount: true } } },
  });
  if (!invoice) throw new Error("Facture introuvable.");

  let lineItems: LineItemValues[];
  if (data.mode === "full") {
    lineItems = invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));
    if (lineItems.length === 0) {
      lineItems = [{ description: invoice.title ?? "Prestation", quantity: 1, unitPrice: Number(invoice.amount) }];
    }
  } else {
    lineItems = parseLineItems(formData);
  }

  const amount = computeLineItemsTotal(lineItems);
  if (amount <= 0) throw new Error("Le montant de l'avoir doit être positif.");

  const alreadyCredited = invoice.creditNotes.reduce((sum, c) => sum + Number(c.amount), 0);
  if (amount + alreadyCredited - Number(invoice.amount) > 0.01) {
    throw new Error("Le total des avoirs dépasserait le montant de la facture.");
  }

  const issueDate = toDate(data.issueDate) ?? new Date();
  await prisma.$transaction(async (tx) => {
    const number = await allocateDocumentNumber(tx, user.organizationId, DocumentKind.CREDIT_NOTE, issueDate);
    const creditNote = await tx.creditNote.create({
      data: {
        organizationId: user.organizationId,
        invoiceId,
        clientId,
        number,
        reason: data.reason || null,
        amount,
        issueDate,
        lineItems: { create: lineItems.map((item, index) => ({ position: index, ...item })) },
      },
    });
    await syncInvoiceStatusAfterChange(tx, invoiceId);
    await tx.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "CREDIT_NOTE_ISSUED",
        message: `Avoir ${creditNote.number} émis sur la facture ${invoice.number} (${amount.toFixed(2)} €).`,
      },
    });
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/credit-notes");
  revalidatePath("/dashboard");
}

export async function deleteCreditNoteAction(clientId: string, creditNoteId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const creditNote = await prisma.creditNote.findFirst({
    where: { id: creditNoteId, organizationId: user.organizationId },
  });
  if (!creditNote) throw new Error("Avoir introuvable.");

  await prisma.$transaction(async (tx) => {
    await tx.creditNote.delete({ where: { id: creditNoteId } });
    await syncInvoiceStatusAfterChange(tx, creditNote.invoiceId);
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/credit-notes");
  revalidatePath("/dashboard");
}
