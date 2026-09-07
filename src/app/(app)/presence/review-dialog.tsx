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
import { saveReviewAction } from "./actions";

const SOURCE_ITEMS = [
  { value: "GOOGLE", label: "Google" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "OTHER", label: "Autre" },
];

const RATING_ITEMS = [
  { value: "5", label: "5 — Excellent" },
  { value: "4", label: "4 — Bien" },
  { value: "3", label: "3 — Moyen" },
  { value: "2", label: "2 — Mauvais" },
  { value: "1", label: "1 — Très mauvais" },
];

export function ReviewDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await saveReviewAction(formData);
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
          <DialogTitle>Ajouter un avis</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="review-source">Source</Label>
              <Select name="source" items={SOURCE_ITEMS} defaultValue="GOOGLE">
                <SelectTrigger id="review-source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-rating">Note</Label>
              <Select name="rating" items={RATING_ITEMS} defaultValue="5">
                <SelectTrigger id="review-rating" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATING_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="review-authorName">Auteur</Label>
              <Input id="review-authorName" name="authorName" placeholder="Ex : Marie D." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="review-receivedAt">Reçu le</Label>
              <Input id="review-receivedAt" name="receivedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="review-comment">Commentaire</Label>
              <Textarea id="review-comment" name="comment" rows={3} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
