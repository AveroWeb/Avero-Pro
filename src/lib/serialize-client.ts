import { toNumber } from "@/lib/format";
import type { ClientDetail } from "@/lib/queries/clients";

/**
 * Prisma `Decimal` instances cannot cross the server -> client component
 * boundary (they are not plain objects). Convert every Decimal field to a
 * plain number before passing client data into a "use client" component.
 */
export function serializeClientDetail(client: ClientDetail) {
  return {
    ...client,
    invoices: client.invoices.map((invoice) => ({
      ...invoice,
      amount: toNumber(invoice.amount),
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
      })),
      payments: invoice.payments.map((payment) => ({
        ...payment,
        amount: toNumber(payment.amount),
      })),
      creditNotes: invoice.creditNotes.map((creditNote) => ({
        ...creditNote,
        amount: toNumber(creditNote.amount),
      })),
    })),
    quotes: client.quotes.map((quote) => ({
      ...quote,
      amount: toNumber(quote.amount),
      lineItems: quote.lineItems.map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
      })),
      invoice: quote.invoice ? { ...quote.invoice, amount: toNumber(quote.invoice.amount) } : null,
    })),
    creditNotes: client.creditNotes.map((creditNote) => ({
      ...creditNote,
      amount: toNumber(creditNote.amount),
      lineItems: creditNote.lineItems.map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
      })),
    })),
  };
}

export type SerializedClientDetail = ReturnType<typeof serializeClientDetail>;
