import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "../client-form";
import { createClientAction } from "../actions";

export const metadata: Metadata = {
  title: "Nouveau client — Avero Pro",
};

export default function NewClientPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau client</h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez un nouveau client à votre portefeuille.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ClientForm action={createClientAction} submitLabel="Créer le client" />
        </CardContent>
      </Card>
    </div>
  );
}
