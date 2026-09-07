import { toNumber } from "@/lib/format";
import type { ClientDetail } from "@/lib/queries/clients";

export function computeClientFinancials(client: Pick<ClientDetail, "invoices">) {
  const totalInvoiced = client.invoices.reduce((sum, i) => sum + toNumber(i.amount), 0);
  const totalPaid = client.invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + toNumber(i.amount), 0);
  const totalUnpaid = client.invoices
    .filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + toNumber(i.amount), 0);

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
