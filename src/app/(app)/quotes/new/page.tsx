import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { requireStaff } from "@/lib/session";
import { listClientOptions } from "@/lib/queries/clients";
import { getOrganizationBilling } from "@/lib/queries/organization";
import { QuoteForm } from "../quote-form";
import { createQuoteAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau devis — Avero Pro" };

export default async function NewQuotePage() {
  const user = await requireStaff();
  const [clients, billing] = await Promise.all([
    listClientOptions(user.organizationId),
    getOrganizationBilling(user.organizationId),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau devis</h1>
        <p className="text-sm text-muted-foreground">Créez un devis pour un client.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <QuoteForm
            action={createQuoteAction}
            clients={clients}
            vatEnabled={billing?.vatEnabled ?? true}
            vatRate={billing?.vatRate ?? 20}
          />
        </CardContent>
      </Card>
    </div>
  );
}
