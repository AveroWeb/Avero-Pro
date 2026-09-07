import { toNumber } from "@/lib/format";
import type { ClientDetail } from "@/lib/queries/clients";

export function computeClientFinancials(client: Pick<ClientDetail, "invoices">) {
  const paidOn = (invoice: ClientDetail["invoices"][number]) =>
    invoice.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);

  const totalInvoiced = client.invoices
    .filter((i) => i.status !== "CANCELLED")
    .reduce((sum, i) => sum + toNumber(i.amount), 0);
  const totalPaid = client.invoices.reduce((sum, i) => sum + paidOn(i), 0);
  const totalUnpaid = client.invoices
    .filter((i) => i.status !== "CANCELLED" && i.status !== "CREDITED")
    .reduce((sum, i) => sum + Math.max(0, toNumber(i.amount) - paidOn(i)), 0);

  return { totalInvoiced, totalPaid, totalUnpaid };
}

export function computeClientTimeline(client: ClientDetail) {
  const now = Date.now();

  const lastInvoice = client.invoices[0]?.issueDate ?? null;
  const lastQuote = client.quotes[0]?.issueDate ?? null;

  const upcomingDates = [
    ...client.invoices.map((i) => i.dueDate),
    ...client.quotes.filter((q) => q.status === "SENT").map((q) => q.validUntil),
  ].filter((date): date is Date => !!date && date.getTime() > now);

  upcomingDates.sort((a, b) => a.getTime() - b.getTime());

  return {
    lastInvoice,
    lastQuote,
    nextDeadline: upcomingDates[0] ?? null,
  };
}
