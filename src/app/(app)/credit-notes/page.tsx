import type { Metadata } from "next";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { listCreditNotes } from "@/lib/queries/credit-notes";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteCreditNoteAction } from "@/app/(app)/clients/[id]/actions";

export const metadata: Metadata = { title: "Avoirs — Avero Pro" };

export default async function CreditNotesPage() {
  const user = await requireStaff();
  const creditNotes = await listCreditNotes(user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Avoirs</h1>
        <p className="text-sm text-muted-foreground">
          {creditNotes.length} avoir{creditNotes.length > 1 ? "s" : ""}. Un avoir s&apos;émet depuis une facture, dans la
          fiche du client.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Aucun avoir. Émets-en un depuis une facture dans la fiche d&apos;un client.
                  </TableCell>
                </TableRow>
              ) : (
                creditNotes.map((creditNote) => (
                  <TableRow key={creditNote.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{creditNote.number}</TableCell>
                    <TableCell>
                      <Link href={`/clients/${creditNote.clientId}`} className="font-medium hover:underline">
                        {creditNote.client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{creditNote.invoice?.number ?? "—"}</TableCell>
                    <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                      {creditNote.reason ?? "—"}
                    </TableCell>
                    <TableCell className="text-red-600 dark:text-red-400">
                      − {formatCurrency(creditNote.amount)}
                    </TableCell>
                    <TableCell>{formatDate(creditNote.issueDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Télécharger le PDF"
                          render={<Link href={`/print/credit-notes/${creditNote.id}`} target="_blank" />}
                          nativeButton={false}
                        >
                          <FileDown className="size-4" />
                        </Button>
                        <DeleteIconButton
                          action={deleteCreditNoteAction.bind(null, creditNote.clientId, creditNote.id)}
                          confirmMessage="Supprimer cet avoir ?"
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
