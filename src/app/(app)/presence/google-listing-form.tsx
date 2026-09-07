"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveGoogleListingAction } from "./actions";

type Listing = {
  businessName: string | null;
  mapsUrl: string | null;
  category: string | null;
  rating: number | null;
  reviewCount: number;
  notes: string | null;
} | null;

export function GoogleListingForm({ listing }: { listing: Listing }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await saveGoogleListingAction(formData);
        toast.success("Fiche Google mise à jour.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gl-businessName">Nom sur Google</Label>
          <Input id="gl-businessName" name="businessName" defaultValue={listing?.businessName ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gl-mapsUrl">Lien de la fiche (Google Maps)</Label>
          <Input id="gl-mapsUrl" name="mapsUrl" defaultValue={listing?.mapsUrl ?? ""} placeholder="https://maps.google.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gl-category">Catégorie</Label>
          <Input id="gl-category" name="category" defaultValue={listing?.category ?? ""} placeholder="Ex : Plombier" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gl-rating">Note moyenne (/5)</Label>
          <Input id="gl-rating" name="rating" type="number" step="0.1" min="0" max="5" defaultValue={listing?.rating ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gl-reviewCount">Nombre d&apos;avis</Label>
          <Input id="gl-reviewCount" name="reviewCount" type="number" min="0" defaultValue={listing?.reviewCount ?? 0} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gl-notes">Notes</Label>
          <Textarea id="gl-notes" name="notes" rows={2} defaultValue={listing?.notes ?? ""} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
