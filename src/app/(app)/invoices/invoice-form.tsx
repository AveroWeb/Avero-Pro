"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineItemsEditor } from "@/components/line-items-editor";

const STATUS_ITEMS = [
  { value: "UNPAID", label: "Impayée" },
  { value: "PAID", label: "Payée" },
  { value: "OVERDUE", label: "En retard" },
  { value: "CANCELLED", label: "Annulée" },
];

type InvoiceFormAction = (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;

export function InvoiceForm({
  action,
  clients,
  vatEnabled,
  vatRate,
}: {
  action: InvoiceFormAction;
  clients: { id: string; companyName: string }[];
  vatEnabled: boolean;
  vatRate: number;
}) {
  const [error, formAction, isPending] = useActionState(action, undefined);
  const clientItems = clients.map((c) => ({ value: c.id, label: c.companyName }));

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client *</Label>
          <Select name="clientId" items={clientItems}>
            <SelectTrigger id="clientId" className="w-full">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {clientItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select name="status" items={STATUS_ITEMS} defaultValue="UNPAID">
            <SelectTrigger id="status" className="w-full">
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Objet</Label>
          <Input id="title" name="title" placeholder="Ex : Rénovation restaurant" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issueDate">Date d&apos;émission *</Label>
          <Input id="issueDate" name="issueDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Échéance</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>

        <LineItemsEditor vatEnabled={vatEnabled} vatRate={vatRate} />

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Créer la facture"}
      </Button>
    </form>
  );
}
