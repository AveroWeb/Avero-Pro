import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getInvoice } from "@/lib/queries/invoices";
import { formatCurrencyPrecise, formatDate, toNumber } from "@/lib/format";
import { AutoPrint } from "@/components/auto-print";
import { LegalFooter } from "@/components/print/legal-footer";

const STATUS_LABELS: Record<string, string> = {
  PAID: "Payée",
  PARTIAL: "Partiellement réglée",
  UNPAID: "Impayée",
  OVERDUE: "En retard",
  CREDITED: "Soldée par avoir",
  CANCELLED: "Annulée",
};

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const invoice = await getInvoice(user.organizationId, id);
  if (!invoice) notFound();

  const reference = invoice.number;
  const org = invoice.organization;
  const vatRate = toNumber(org.vatRate);
  const title = invoice.title ?? invoice.quote?.title ?? null;
  // Invoices created before line items existed have none — fall back to a single row from the stored total.
  const lineItems =
    invoice.lineItems.length > 0
      ? invoice.lineItems
      : [{ id: invoice.id, description: title ?? "Prestation", quantity: 1, unitPrice: invoice.amount }];
  const subtotal = lineItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0);
  const vatAmount = org.vatEnabled ? subtotal * (vatRate / 100) : 0;
  const total = subtotal + vatAmount;
  const paid = invoice.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const remaining = Math.max(0, total - paid);

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
          <p className="text-3xl font-bold tracking-tight">FACTURE</p>
          <p className="mt-1 text-sm text-black/60">N° {reference}</p>
          {invoice.quote && <p className="text-xs text-black/50">Sur devis N° {invoice.quote.number}</p>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-black/50">Destinataire</p>
          <p className="mt-1 font-medium">{invoice.client.companyName}</p>
          {invoice.client.contactName && <p className="text-sm">{invoice.client.contactName}</p>}
          {invoice.client.address && <p className="whitespace-pre-wrap text-sm text-black/70">{invoice.client.address}</p>}
          {invoice.client.email && <p className="text-sm text-black/70">{invoice.client.email}</p>}
          {invoice.client.phone && <p className="text-sm text-black/70">{invoice.client.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm">
            <span className="text-black/50">Date d&apos;émission : </span>
            {formatDate(invoice.issueDate)}
          </p>
          {invoice.dueDate && (
            <p className="text-sm">
              <span className="text-black/50">Échéance : </span>
              {formatDate(invoice.dueDate)}
            </p>
          )}
          <p className="text-sm">
            <span className="text-black/50">Statut : </span>
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </p>
        </div>
      </div>

      {title && <p className="mt-8 text-lg font-semibold">{title}</p>}

      <table className={`w-full border-collapse text-sm ${title ? "mt-3" : "mt-8"}`}>
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

      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="max-w-sm text-xs text-black/60">
          {(org.iban || org.bankName) && (
            <>
              <p className="font-medium uppercase tracking-wide text-black/50">Règlement par virement</p>
              {org.bankName && <p>Banque : {org.bankName}</p>}
              {org.iban && <p>IBAN : {org.iban}</p>}
              {org.bic && <p>BIC : {org.bic}</p>}
            </>
          )}
        </div>
        <div className="w-full max-w-xs space-y-1 text-sm">
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
          {paid > 0 && (
            <>
              <div className="flex justify-between pt-1">
                <span className="text-black/60">Déjà réglé</span>
                <span>− {formatCurrencyPrecise(paid)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Reste à payer</span>
                <span>{formatCurrencyPrecise(remaining)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {invoice.creditNotes.length > 0 && (
        <p className="mt-4 text-xs text-black/60">
          Avoir(s) rattaché(s) :{" "}
          {invoice.creditNotes
            .map((creditNote) => `${creditNote.number} (${formatCurrencyPrecise(creditNote.amount)})`)
            .join(", ")}
          .
        </p>
      )}

      {invoice.notes && (
        <div className="mt-8 border-t border-black/10 pt-4">
          <p className="text-xs font-medium uppercase text-black/50">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{invoice.notes}</p>
        </div>
      )}

      {org.paymentTerms && (
        <div className="mt-6 border-t border-black/10 pt-4 text-xs text-black/60">
          <p className="whitespace-pre-wrap">{org.paymentTerms}</p>
        </div>
      )}

      <LegalFooter org={org} variant="invoice" />
    </div>
  );
}
