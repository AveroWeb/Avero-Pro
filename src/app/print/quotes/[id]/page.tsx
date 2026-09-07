import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getQuote } from "@/lib/queries/quotes";
import { formatCurrencyPrecise, formatDate, toNumber } from "@/lib/format";
import { AutoPrint } from "@/components/auto-print";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
};

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const quote = await getQuote(user.organizationId, id);
  if (!quote) notFound();

  const reference = `DEV-${quote.id.slice(-6).toUpperCase()}`;
  const org = quote.organization;
  const vatRate = toNumber(org.vatRate);
  // Quotes created before line items existed have none — fall back to a single row from the stored total.
  const lineItems =
    quote.lineItems.length > 0
      ? quote.lineItems
      : [{ id: quote.id, description: quote.title, quantity: 1, unitPrice: quote.amount }];
  const subtotal = lineItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0);
  const vatAmount = org.vatEnabled ? subtotal * (vatRate / 100) : 0;
  const total = subtotal + vatAmount;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-black print:p-0">
      <AutoPrint />

      <div className="flex items-start justify-between border-b-2 border-black pb-6">
        <div>
          <p className="text-xl font-bold">{org.name}</p>
          {org.address && <p className="mt-1 whitespace-pre-wrap text-sm text-black/70">{org.address}</p>}
          <p className="mt-1 space-x-3 text-sm text-black/70">
            {org.phone && <span>{org.phone}</span>}
            {org.contactEmail && <span>{org.contactEmail}</span>}
          </p>
          {(org.siret || org.vatNumber) && (
            <p className="mt-1 text-xs text-black/50">
              {org.siret && <>SIRET : {org.siret}</>}
              {org.siret && org.vatNumber && " · "}
              {org.vatNumber && <>TVA intracom. : {org.vatNumber}</>}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight">DEVIS</p>
          <p className="mt-1 text-sm text-black/60">N° {reference}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-black/50">Destinataire</p>
          <p className="mt-1 font-medium">{quote.client.companyName}</p>
          {quote.client.contactName && <p className="text-sm">{quote.client.contactName}</p>}
          {quote.client.address && <p className="whitespace-pre-wrap text-sm text-black/70">{quote.client.address}</p>}
          {quote.client.email && <p className="text-sm text-black/70">{quote.client.email}</p>}
          {quote.client.phone && <p className="text-sm text-black/70">{quote.client.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm">
            <span className="text-black/50">Date d&apos;émission : </span>
            {formatDate(quote.issueDate)}
          </p>
          {quote.validUntil && (
            <p className="text-sm">
              <span className="text-black/50">Valable jusqu&apos;au : </span>
              {formatDate(quote.validUntil)}
            </p>
          )}
          <p className="text-sm">
            <span className="text-black/50">Statut : </span>
            {STATUS_LABELS[quote.status] ?? quote.status}
          </p>
        </div>
      </div>

      <p className="mt-8 text-lg font-semibold">{quote.title}</p>

      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 text-right font-medium">Qté</th>
            <th className="py-2 text-right font-medium">Prix U.</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.id} className="border-b border-black/10">
              <td className="py-2.5">{item.description}</td>
              <td className="py-2.5 text-right">{toNumber(item.quantity)}</td>
              <td className="py-2.5 text-right">{formatCurrencyPrecise(item.unitPrice)}</td>
              <td className="py-2.5 text-right">{formatCurrencyPrecise(toNumber(item.quantity) * toNumber(item.unitPrice))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-black/60">Sous-total HT</span>
          <span>{formatCurrencyPrecise(subtotal)}</span>
        </div>
        {org.vatEnabled ? (
          <div className="flex justify-between">
            <span className="text-black/60">TVA ({vatRate}%)</span>
            <span>{formatCurrencyPrecise(vatAmount)}</span>
          </div>
        ) : (
          <p className="text-xs text-black/50">TVA non applicable, art. 293B du CGI</p>
        )}
        <div className="flex justify-between border-t border-black pt-1 text-base font-bold">
          <span>Total {org.vatEnabled ? "TTC" : ""}</span>
          <span>{formatCurrencyPrecise(total)}</span>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-8 border-t border-black/10 pt-4">
          <p className="text-xs font-medium uppercase text-black/50">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{quote.notes}</p>
        </div>
      )}

      {org.paymentTerms && (
        <div className="mt-6 border-t border-black/10 pt-4 text-xs text-black/60">
          <p className="whitespace-pre-wrap">{org.paymentTerms}</p>
        </div>
      )}
    </div>
  );
}
