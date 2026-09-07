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
import { LineItemsEditor, type LineItemDraft } from "@/components/line-items-editor";
import { formatCurrencyPrecise } from "@/lib/format";
import { createCreditNoteAction } from "./actions";

type InvoiceForCreditNote = {
  id: string;
  number: string;
  amount: number;
  title: string | null;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
};

export function CreditNoteDialog({
  trigger,
  clientId,
  invoice,
  vatEnabled,
  vatRate,
}: {
  trigger: ReactNode;
  clientId: string;
  invoice: InvoiceForCreditNote;
  vatEnabled: boolean;
  vatRate: number;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"full" | "custom">("full");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const initialItems: LineItemDraft[] =
    invoice.lineItems.length > 0
      ? invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
        }))
      : [{ description: invoice.title ?? "Prestation", quantity: "1", unitPrice: String(invoice.amount) }];

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await createCreditNoteAction(clientId, invoice.id, formData);
        setOpen(false);
        setMode("full");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Émettre un avoir — facture {invoice.number}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="mode" value={mode} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "full" ? "default" : "outline"}
              onClick={() => setMode("full")}
            >
              Avoir total ({formatCurrencyPrecise(invoice.amount)})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "custom" ? "default" : "outline"}
              onClick={() => setMode("custom")}
            >
              Montant personnalisé
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="credit-issueDate">Date d&apos;émission *</Label>
              <Input
                id="credit-issueDate"
                name="issueDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="credit-reason">Motif</Label>
              <Textarea id="credit-reason" name="reason" rows={2} placeholder="Ex : geste commercial, prestation annulée…" />
            </div>

            {mode === "custom" && (
              <LineItemsEditor initialItems={initialItems} vatEnabled={vatEnabled} vatRate={vatRate} />
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Émission…" : "Émettre l'avoir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
