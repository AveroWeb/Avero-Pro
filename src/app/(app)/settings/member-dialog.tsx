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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMemberAction } from "./actions";

const ROLE_ITEMS = [
  { value: "MEMBER", label: "Membre" },
  { value: "ADMIN", label: "Administrateur" },
];

export function MemberDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await createMemberAction(formData);
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
          <DialogTitle>Nouveau membre</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">Nom *</Label>
            <Input id="member-name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-email">Email *</Label>
            <Input id="member-email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-password">Mot de passe temporaire *</Label>
            <Input id="member-password" name="password" type="text" required minLength={8} />
            <p className="text-xs text-muted-foreground">
              Transmets-le à ton ami par un canal sûr — il pourra le changer plus tard.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-role">Rôle</Label>
            <Select name="role" items={ROLE_ITEMS} defaultValue="MEMBER">
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création…" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
