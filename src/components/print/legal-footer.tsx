import { formatCurrencyPrecise } from "@/lib/format";

type LegalOrg = {
  siret: string | null;
  legalForm: string | null;
  shareCapital: string | null;
  rcsCity: string | null;
  latePenaltyText: string | null;
  recoveryIndemnity: unknown;
  discountTerms: string | null;
  quoteValidityDays: number;
};

/**
 * Mandatory legal mentions printed at the bottom of quote / invoice / credit-note
 * PDFs (French Code de commerce, art. L441-9 & L441-10).
 */
export function LegalFooter({
  org,
  variant,
}: {
  org: LegalOrg;
  variant: "invoice" | "quote" | "credit-note";
}) {
  const penalty = org.latePenaltyText?.trim() || "3 fois le taux d'intérêt légal";
  const discount = org.discountTerms?.trim() || "Pas d'escompte pour paiement anticipé.";
  const indemnity = formatCurrencyPrecise(org.recoveryIndemnity);

  const identity = [
    org.legalForm,
    org.shareCapital ? `capital social ${org.shareCapital}` : null,
    org.rcsCity ? `RCS ${org.rcsCity}` : null,
    org.siret ? `SIRET ${org.siret}` : null,
  ].filter(Boolean);

  return (
    <div className="mt-8 border-t border-black/10 pt-4 text-[11px] leading-relaxed text-black/55">
      {variant === "quote" ? (
        <>
          <p>Devis valable {org.quoteValidityDays} jours à compter de sa date d&apos;émission.</p>
          <p className="mt-3">Bon pour accord — date et signature du client, précédées de la mention « Bon pour accord » :</p>
          <div className="mt-1 h-16 w-64 border border-black/20" />
        </>
      ) : (
        <p>
          En cas de retard de paiement, application de pénalités de retard ({penalty}) ainsi que d&apos;une indemnité
          forfaitaire pour frais de recouvrement de {indemnity} (art. L441-10 et D441-5 du Code de commerce). {discount}
        </p>
      )}
      {identity.length > 0 && <p className="mt-3">{identity.join(" · ")}</p>}
    </div>
  );
}
