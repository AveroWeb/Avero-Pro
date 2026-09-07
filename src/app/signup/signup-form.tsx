"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { signupAction } from "./actions";

export function SignupForm() {
  const [error, formAction, isPending] = useActionState(signupAction, undefined);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Nom de votre entreprise</Label>
            <Input id="organizationName" name="organizationName" required placeholder="Ex : Boulangerie Martin" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Activité</Label>
            <Input id="sector" name="sector" placeholder="Ex : Boulangerie, Plomberie, Coiffure…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Votre nom</Label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création du compte..." : "Créer mon compte gratuitement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
