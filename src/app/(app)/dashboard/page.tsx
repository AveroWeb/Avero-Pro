import type { Metadata } from "next";
import { Users, FileSignature, Receipt, Star, MessageSquareOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertItem, type AlertEntry } from "@/components/dashboard/alert-item";
import { requireStaff } from "@/lib/session";
import { getDashboardOverview } from "@/lib/queries/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard — Avero Pro",
};

export default async function DashboardPage() {
  const user = await requireStaff();
  const data = await getDashboardOverview(user.organizationId);

  const alertEntries: AlertEntry[] = [
    ...data.alerts.overdueInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      severity: "red" as const,
      title: `Facture en retard — ${formatCurrency(invoice.amount)}`,
      subtitle: invoice.client.companyName,
      href: `/clients/${invoice.clientId}`,
    })),
    ...data.alerts.expiringQuotes.map((quote) => ({
      id: `quote-${quote.id}`,
      severity: "orange" as const,
      title: `Devis "${quote.title}" bientôt expiré`,
      subtitle: `${quote.client.companyName} · valable jusqu'au ${formatDate(quote.validUntil)}`,
      href: `/clients/${quote.clientId}`,
    })),
    ...data.alerts.unansweredReviews.map((review) => ({
      id: `review-${review.id}`,
      severity: "yellow" as const,
      title: `Avis ${review.rating}/5 sans réponse`,
      subtitle: review.authorName ?? "Client anonyme",
      href: "/presence",
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          La situation de votre activité en un coup d&apos;œil.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Clients actifs" value={String(data.kpis.activeClients)} icon={Users} />
        <KpiCard title="Devis en attente" value={String(data.kpis.pendingQuotesCount)} icon={FileSignature} />
        <KpiCard
          title="Factures impayées"
          value={`${data.kpis.unpaidInvoicesCount} · ${formatCurrency(data.kpis.unpaidAmount)}`}
          icon={Receipt}
          tone={data.kpis.unpaidInvoicesCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Note Google"
          value={data.kpis.googleRating ? `${data.kpis.googleRating.toFixed(1)}/5 (${data.kpis.googleReviewCount})` : "—"}
          icon={Star}
          tone="success"
        />
        <KpiCard
          title="Avis sans réponse"
          value={String(data.kpis.unansweredReviewsCount)}
          icon={MessageSquareOff}
          tone={data.kpis.unansweredReviewsCount > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>À surveiller</CardTitle>
        </CardHeader>
        <CardContent>
          {alertEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Rien à signaler pour le moment.
            </p>
          ) : (
            <div className="flex flex-col">
              {alertEntries.map((entry) => (
                <AlertItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
