import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/session";
import { getClientDetail } from "@/lib/queries/clients";
import { getOrganizationBilling } from "@/lib/queries/organization";
import { StatusBadge, clientStatusMeta } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { computeClientFinancials, computeClientTimeline } from "@/lib/client-overview";
import { serializeClientDetail } from "@/lib/serialize-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { ClientDetailTabs } from "./client-detail-tabs";
import { deleteClientAction } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const user = await requireStaff();
  const { id } = await params;
  const client = await getClientDetail(user.organizationId, id);
  return { title: client ? `${client.companyName} — Avero Pro` : "Client — Avero Pro" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const [client, billing] = await Promise.all([
    getClientDetail(user.organizationId, id),
    getOrganizationBilling(user.organizationId),
  ]);
  if (!client) notFound();

  const financials = computeClientFinancials(client);
  const timeline = computeClientTimeline(client);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{client.companyName}</h1>
            <StatusBadge meta={clientStatusMeta[client.status]} />
          </div>
          {client.contactName && (
            <p className="text-sm text-muted-foreground">
              {client.contactName}
              {client.email ? ` · ${client.email}` : ""}
              {client.phone ? ` · ${client.phone}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/clients/${client.id}/edit`} />} nativeButton={false}>
            <Pencil />
            Modifier
          </Button>
          <DeleteButton
            action={deleteClientAction.bind(null, client.id)}
            confirmMessage={`Supprimer le client « ${client.companyName} » ? Ses devis et factures seront aussi supprimés. Cette action est irréversible.`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewStat label="Total facturé" value={formatCurrency(financials.totalInvoiced)} />
        <OverviewStat label="Total encaissé" value={formatCurrency(financials.totalPaid)} tone="success" />
        <OverviewStat
          label="Reste dû"
          value={formatCurrency(financials.totalUnpaid)}
          tone={financials.totalUnpaid > 0 ? "danger" : "default"}
        />
        <OverviewStat label="Dernier devis" value={formatDate(timeline.lastQuote)} />
        <OverviewStat label="Dernière facture" value={formatDate(timeline.lastInvoice)} />
        <OverviewStat label="Prochaine échéance" value={formatDate(timeline.nextDeadline)} />
      </div>

      <ClientDetailTabs
        client={serializeClientDetail(client)}
        financials={financials}
        vatEnabled={billing?.vatEnabled ?? true}
        vatRate={billing?.vatRate ?? 20}
      />
    </div>
  );
}

function OverviewStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "danger"
        ? "text-red-600 dark:text-red-400"
        : "";

  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
