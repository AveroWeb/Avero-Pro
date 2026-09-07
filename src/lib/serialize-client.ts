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
  };
}

export type SerializedClientDetail = ReturnType<typeof serializeClientDetail>;
