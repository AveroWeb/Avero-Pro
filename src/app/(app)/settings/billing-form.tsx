"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBillingAction } from "./actions";

type Billing = {
  address: string | null;
  siret: string | null;
  vatNumber: string | null;
  phone: string | null;
  contactEmail: string | null;
  bankName: string | null;
  iban: string | null;
  bic: string | null;
  paymentTerms: string | null;
  vatEnabled: boolean;
  vatRate: number;
};

export function BillingForm({ billing }: { billing: Billing }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [vatEnabled, setVatEnabled] = useState(billing.vatEnabled);

  function handleSubmit(formData: FormData) {
    setError(undefined);
    formData.set("vatEnabled", vatEnabled ? "true" : "false");
    startTransition(async () => {
      try {
        await updateBillingAction(formData);
        toast.success("Informations de facturation enregistrées.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billing-address">Adresse</Label>
          <Textarea id="billing-address" name="address" rows={2} defaultValue={billing.address ?? ""} placeholder="15 rue des Lilas, 75011 Paris" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing-siret">SIRET</Label>
          <Input id="billing-siret" name="siret" defaultValue={billing.siret ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing-vatNumber">N° TVA intracommunautaire</Label>
          <Input id="billing-vatNumber" name="vatNumber" defaultValue={billing.vatNumber ?? ""} placeholder="FR12 345678901" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing-phone">Téléphone</Label>
          <Input id="billing-phone" name="phone" defaultValue={billing.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing-contactEmail">Email de contact</Label>
          <Input id="billing-contactEmail" name="contactEmail" type="email" defaultValue={billing.contactEmail ?? ""} />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="billing-vatEnabled"
            checked={vatEnabled}
            onChange={(e) => setVatEnabled(e.target.checked)}
            className="size-4"
          />
          <Label htmlFor="billing-vatEnabled" className="font-normal">
            Assujetti à la TVA
          </Label>
        </div>
        {vatEnabled && (
          <div className="space-y-2">
            <Label htmlFor="billing-vatRate">Taux de TVA (%)</Label>
            <Input id="billing-vatRate" name="vatRate" type="number" step="0.1" min="0" defaultValue={billing.vatRate} />
          </div>
        )}
        {!vatEnabled && <input type="hidden" name="vatRate" value={billing.vatRate} />}

        <div className="space-y-2">
          <Label htmlFor="billing-bankName">Banque</Label>
          <Input id="billing-bankName" name="bankName" defaultValue={billing.bankName ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing-iban">IBAN</Label>
          <Input id="billing-iban" name="iban" defaultValue={billing.iban ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing-bic">BIC</Label>
          <Input id="billing-bic" name="bic" defaultValue={billing.bic ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billing-paymentTerms">Mentions légales / conditions de paiement</Label>
          <Textarea
            id="billing-paymentTerms"
            name="paymentTerms"
            rows={3}
            defaultValue={billing.paymentTerms ?? ""}
            placeholder="Paiement à 30 jours. Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €."
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
