import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { requireStaff } from "@/lib/session";
import { listClientOptions } from "@/lib/queries/clients";
import { getOrganizationBilling } from "@/lib/queries/organization";
import { InvoiceForm } from "../invoice-form";
import { createInvoiceAction } from "../actions";

export const metadata: Metadata = { title: "Nouvelle facture — Avero Pro" };

export default async function NewInvoicePage() {
  const user = await requireStaff();
  const [clients, billing] = await Promise.all([
    listClientOptions(user.organizationId),
    getOrganizationBilling(user.organizationId),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle facture</h1>
        <p className="text-sm text-muted-foreground">Créez une facture pour un client.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <InvoiceForm
            action={createInvoiceAction}
            clients={clients}
            vatEnabled={billing?.vatEnabled ?? true}
            vatRate={billing?.vatRate ?? 20}
          />
        </CardContent>
      </Card>
    </div>
  );
}
