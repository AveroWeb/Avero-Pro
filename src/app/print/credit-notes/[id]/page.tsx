import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getCreditNote } from "@/lib/queries/credit-notes";
import { formatCurrencyPrecise, formatDate, toNumber } from "@/lib/format";
import { AutoPrint } from "@/components/auto-print";
import { LegalFooter } from "@/components/print/legal-footer";

export default async function CreditNotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const creditNote = await getCreditNote(user.organizationId, id);
  if (!creditNote) notFound();

  const org = creditNote.organization;
  const vatRate = toNumber(org.vatRate);
  const lineItems =
    creditNote.lineItems.length > 0
      ? creditNote.lineItems
      : [{ id: creditNote.id, description: "Avoir", quantity: 1, unitPrice: creditNote.amount }];
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
          <p className="text-3xl font-bold tracking-tight">AVOIR</p>
          <p className="mt-1 text-sm text-black/60">N° {creditNote.number}</p>
          {creditNote.invoice && (
            <p className="text-xs text-black/50">Se rapporte à la facture N° {creditNote.invoice.number}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-black/50">Destinataire</p>
          <p className="mt-1 font-medium">{creditNote.client.companyName}</p>
          {creditNote.client.contactName && <p className="text-sm">{creditNote.client.contactName}</p>}
          {creditNote.client.address && (
            <p className="whitespace-pre-wrap text-sm text-black/70">{creditNote.client.address}</p>
          )}
          {creditNote.client.email && <p className="text-sm text-black/70">{creditNote.client.email}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm">
            <span className="text-black/50">Date d&apos;émission : </span>
            {formatDate(creditNote.issueDate)}
          </p>
          {creditNote.invoice && (
            <p className="text-sm">
              <span className="text-black/50">Facture d&apos;origine : </span>
              {formatDate(creditNote.invoice.issueDate)}
            </p>
          )}
        </div>
      </div>

      {creditNote.reason && <p className="mt-8 text-sm">Motif : {creditNote.reason}</p>}

      <table className={`w-full border-collapse text-sm ${creditNote.reason ? "mt-3" : "mt-8"}`}>
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
              <td className="py-2.5 text-right">
                {formatCurrencyPrecise(toNumber(item.quantity) * toNumber(item.unitPrice))}
              </td>
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
          <span>Montant de l&apos;avoir {org.vatEnabled ? "TTC" : ""}</span>
          <span>− {formatCurrencyPrecise(total)}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-black/60">
        Cet avoir vient en déduction des sommes dues au titre de la facture{" "}
        {creditNote.invoice ? `N° ${creditNote.invoice.number}` : "d'origine"}.
      </p>

      <LegalFooter org={org} variant="credit-note" />
    </div>
  );
}
