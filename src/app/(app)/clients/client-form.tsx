"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClientFormAction = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

const STATUS_ITEMS = [
  { value: "ACTIVE", label: "Actif" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "INACTIVE", label: "Inactif" },
];

export function ClientForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: ClientFormAction;
  submitLabel: string;
  defaultValues?: {
    companyName?: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    status?: string;
  };
}) {
  const [error, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">Nom de l&apos;entreprise *</Label>
          <Input
            id="companyName"
            name="companyName"
            required
            defaultValue={defaultValues?.companyName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Nom du contact</Label>
          <Input id="contactName" name="contactName" defaultValue={defaultValues?.contactName ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select name="status" items={STATUS_ITEMS} defaultValue={defaultValues?.status ?? "PROSPECT"}>
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
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" name="address" defaultValue={defaultValues?.address ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes internes</Label>
          <Textarea id="notes" name="notes" rows={4} defaultValue={defaultValues?.notes ?? ""} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
