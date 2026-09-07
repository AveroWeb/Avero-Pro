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
import { LineItemsEditor, type LineItemDraft } from "@/components/line-items-editor";
import { saveInvoiceAction } from "./actions";

const STATUS_ITEMS = [
  { value: "UNPAID", label: "Impayée" },
  { value: "PAID", label: "Payée" },
  { value: "OVERDUE", label: "En retard" },
  { value: "CANCELLED", label: "Annulée" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function InvoiceDialog({
  trigger,
  clientId,
  vatEnabled,
  vatRate,
  invoice,
}: {
  trigger: ReactNode;
  clientId: string;
  vatEnabled: boolean;
  vatRate: number;
  invoice?: {
    id: string;
    title: string | null;
    amount: number;
    status: string;
    issueDate: Date | string;
    dueDate: Date | string | null;
    notes: string | null;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  // Invoices created before line items existed have none — fall back to a single row from the stored total.
  const initialItems: LineItemDraft[] | undefined = invoice
    ? invoice.lineItems.length > 0
      ? invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
        }))
      : [{ description: invoice.title ?? "Prestation", quantity: "1", unitPrice: String(invoice.amount) }]
    : undefined;

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await saveInvoiceAction(invoice?.id ?? null, clientId, formData);
        setOpen(false);
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
          <DialogTitle>{invoice ? "Modifier la facture" : "Nouvelle facture"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invoice-title">Objet</Label>
              <Input id="invoice-title" name="title" defaultValue={invoice?.title ?? ""} placeholder="Ex : Rénovation restaurant" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={invoice?.status ?? "UNPAID"}>
                <SelectTrigger id="invoice-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-issueDate">Date d&apos;émission *</Label>
              <Input
                id="invoice-issueDate"
                name="issueDate"
                type="date"
                required
                defaultValue={toDateInputValue(invoice?.issueDate) || toDateInputValue(new Date())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-dueDate">Échéance</Label>
              <Input id="invoice-dueDate" name="dueDate" type="date" defaultValue={toDateInputValue(invoice?.dueDate)} />
            </div>

            <LineItemsEditor initialItems={initialItems} vatEnabled={vatEnabled} vatRate={vatRate} />

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invoice-notes">Notes</Label>
              <Textarea id="invoice-notes" name="notes" rows={2} defaultValue={invoice?.notes ?? ""} />
            </div>
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
