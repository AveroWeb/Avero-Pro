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
import { saveSiteAction } from "./actions";

const STATUS_ITEMS = [
  { value: "ONLINE", label: "En ligne" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OFFLINE", label: "Hors ligne" },
  { value: "NOT_LAUNCHED", label: "Pas encore en ligne" },
];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function SiteDialog({
  trigger,
  site,
}: {
  trigger: ReactNode;
  site?: {
    id: string;
    name: string;
    url: string | null;
    status: string;
    launchedAt: Date | string | null;
    notes: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await saveSiteAction(site?.id ?? null, formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{site ? "Modifier mon site" : "Ajouter un site"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="site-name">Nom *</Label>
              <Input id="site-name" name="name" required defaultValue={site?.name} placeholder="Ex : Site vitrine" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="site-url">Adresse (URL)</Label>
              <Input id="site-url" name="url" defaultValue={site?.url ?? ""} placeholder="https://mon-entreprise.fr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-status">Statut</Label>
              <Select name="status" items={STATUS_ITEMS} defaultValue={site?.status ?? "NOT_LAUNCHED"}>
                <SelectTrigger id="site-status" className="w-full">
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
              <Label htmlFor="site-launchedAt">Mis en ligne le</Label>
              <Input id="site-launchedAt" name="launchedAt" type="date" defaultValue={toDateInputValue(site?.launchedAt)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="site-notes">Notes</Label>
              <Textarea id="site-notes" name="notes" rows={2} defaultValue={site?.notes ?? ""} />
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
