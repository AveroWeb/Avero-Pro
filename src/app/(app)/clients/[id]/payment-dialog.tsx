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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyPrecise } from "@/lib/format";
import { recordPaymentAction } from "./actions";

const METHOD_ITEMS = [
  { value: "TRANSFER", label: "Virement" },
  { value: "CARD", label: "Carte" },
  { value: "CASH", label: "Espèces" },
  { value: "CHECK", label: "Chèque" },
  { value: "OTHER", label: "Autre" },
];

export function PaymentDialog({
  trigger,
  clientId,
  invoiceId,
  invoiceNumber,
  remaining,
}: {
  trigger: ReactNode;
  clientId: string;
  invoiceId: string;
  invoiceNumber: string;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await recordPaymentAction(clientId, invoiceId, formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement — facture {invoiceNumber}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">Reste dû : {formatCurrencyPrecise(remaining)}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Montant (€) *</Label>
              <Input
                id="payment-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={remaining > 0 ? remaining.toFixed(2) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Moyen de paiement</Label>
              <Select name="method" items={METHOD_ITEMS} defaultValue="TRANSFER">
                <SelectTrigger id="payment-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-receivedAt">Date de réception *</Label>
              <Input
                id="payment-receivedAt"
                name="receivedAt"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-note">Note</Label>
              <Textarea id="payment-note" name="note" rows={2} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer le paiement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
