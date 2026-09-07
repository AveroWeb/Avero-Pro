"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCatalogItemAction } from "./actions";

type CatalogItem = {
  id: string;
  label: string;
  description: string | null;
  unitPrice: number;
  unit: string | null;
  active: boolean;
};

export function CatalogItemDialog({ trigger, item }: { trigger: ReactNode; item?: CatalogItem }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(item?.active ?? true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    formData.set("active", active ? "true" : "false");
    startTransition(async () => {
      try {
        await saveCatalogItemAction(item?.id ?? null, formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="catalog-label">Libellé *</Label>
            <Input id="catalog-label" name="label" required defaultValue={item?.label ?? ""} placeholder="Ex : Forfait entretien mensuel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-description">Description</Label>
            <Textarea id="catalog-description" name="description" rows={2} defaultValue={item?.description ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catalog-unitPrice">Prix unitaire HT (€) *</Label>
              <Input
                id="catalog-unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={item ? item.unitPrice : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-unit">Unité</Label>
              <Input id="catalog-unit" name="unit" defaultValue={item?.unit ?? ""} placeholder="h, jour, forfait…" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="catalog-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4"
            />
            <Label htmlFor="catalog-active" className="font-normal">
              Actif (proposé dans les devis et factures)
            </Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
