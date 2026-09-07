import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileDown } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { listQuotes } from "@/lib/queries/quotes";
import { StatusBadge, quoteStatusMeta } from "@/components/status-badge";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteQuoteAction } from "@/app/(app)/clients/[id]/actions";

export const metadata: Metadata = { title: "Devis — Avero Pro" };

export default async function QuotesPage() {
  const user = await requireStaff();
  const quotes = await listQuotes(user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Devis</h1>
          <p className="text-sm text-muted-foreground">
            {quotes.length} devis, tous clients confondus.
          </p>
        </div>
        <Button render={<Link href="/quotes/new" />} nativeButton={false}>
          <Plus />
          Nouveau devis
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Devis</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Émission</TableHead>
                <TableHead>Valable jusqu&apos;au</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Aucun devis. Crée-en un depuis la fiche d&apos;un client.
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{quote.number}</TableCell>
                    <TableCell>
                      <Link href={`/clients/${quote.client.id}`} className="font-medium hover:underline">
                        {quote.client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>{quote.title}</TableCell>
                    <TableCell>{formatCurrency(Number(quote.amount))}</TableCell>
                    <TableCell>{formatDate(quote.issueDate)}</TableCell>
                    <TableCell>{formatDate(quote.validUntil)}</TableCell>
                    <TableCell><StatusBadge meta={quoteStatusMeta[quote.status]} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Télécharger le PDF"
                          render={<Link href={`/print/quotes/${quote.id}`} target="_blank" />}
                          nativeButton={false}
                        >
                          <FileDown className="size-4" />
                        </Button>
                        <DeleteIconButton
                          action={deleteQuoteAction.bind(null, quote.client.id, quote.id)}
                          confirmMessage="Êtes-vous sûr de vouloir supprimer ce devis ?"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
