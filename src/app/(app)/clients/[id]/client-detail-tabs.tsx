"use client";

import { Fragment, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Receipt,
  FileSignature,
  StickyNote,
  History,
  ArrowRightCircle,
  FileDown,
  Coins,
  Undo2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { MarkDoneButton } from "@/components/mark-done-button";
import { StatusBadge, invoiceStatusMeta, quoteStatusMeta } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { computeInvoicePaymentState, effectiveInvoiceStatus, PAYMENT_METHOD_LABELS } from "@/lib/payments";
import type { SerializedClientDetail } from "@/lib/serialize-client";
import type { CatalogOption } from "@/lib/queries/catalog";
import { InvoiceDialog } from "./invoice-dialog";
import { QuoteDialog } from "./quote-dialog";
import { PaymentDialog } from "./payment-dialog";
import { CreditNoteDialog } from "./credit-note-dialog";
import {
  deleteInvoiceAction,
  markInvoicePaidAction,
  deleteQuoteAction,
  convertQuoteToInvoiceAction,
  deletePaymentAction,
  deleteCreditNoteAction,
} from "./actions";

type Financials = { totalInvoiced: number; totalPaid: number; totalUnpaid: number };

export function ClientDetailTabs({
  client,
  financials,
  vatEnabled,
  vatRate,
  catalog,
}: {
  client: SerializedClientDetail;
  financials: Financials;
  vatEnabled: boolean;
  vatRate: number;
  catalog: CatalogOption[];
}) {
  return (
    <Tabs defaultValue="quotes" className="gap-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="quotes"><FileSignature className="size-4" /> Devis ({client.quotes.length})</TabsTrigger>
        <TabsTrigger value="invoices"><Receipt className="size-4" /> Factures ({client.invoices.length})</TabsTrigger>
        <TabsTrigger value="credit-notes"><Undo2 className="size-4" /> Avoirs ({client.creditNotes.length})</TabsTrigger>
        <TabsTrigger value="notes"><StickyNote className="size-4" /> Notes</TabsTrigger>
        <TabsTrigger value="history"><History className="size-4" /> Historique</TabsTrigger>
      </TabsList>

      <TabsContent value="quotes">
        <div className="mb-3 flex justify-end">
          <QuoteDialog
            clientId={client.id}
            vatEnabled={vatEnabled}
            vatRate={vatRate}
            catalog={catalog}
            trigger={
              <Button size="sm">
                <Plus /> Nouveau devis
              </Button>
            }
          />
        </div>
        <EmptyableTable empty={client.quotes.length === 0} message="Aucun devis pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Devis</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Émission</TableHead>
              <TableHead>Valable jusqu&apos;au</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">{quote.number}</TableCell>
                <TableCell className="font-medium">{quote.title}</TableCell>
                <TableCell>{formatCurrency(quote.amount)}</TableCell>
                <TableCell>{formatDate(quote.issueDate)}</TableCell>
                <TableCell>{formatDate(quote.validUntil)}</TableCell>
                <TableCell><StatusBadge meta={quoteStatusMeta[quote.status]} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {quote.status === "ACCEPTED" && !quote.invoice && (
                      <ConvertQuoteButton action={convertQuoteToInvoiceAction.bind(null, client.id, quote.id)} />
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Télécharger le PDF"
                      render={<Link href={`/print/quotes/${quote.id}`} target="_blank" />}
                      nativeButton={false}
                    >
                      <FileDown className="size-4" />
                    </Button>
                    <QuoteDialog
                      clientId={client.id}
                      vatEnabled={vatEnabled}
                      vatRate={vatRate}
                      catalog={catalog}
                      quote={quote}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteIconButton
                      action={deleteQuoteAction.bind(null, client.id, quote.id)}
                      confirmMessage={`Supprimer le devis "${quote.title}" ?`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="invoices">
        <div className="mb-3 flex justify-end">
          <InvoiceDialog
            clientId={client.id}
            vatEnabled={vatEnabled}
            vatRate={vatRate}
            catalog={catalog}
            trigger={
              <Button size="sm">
                <Plus /> Nouvelle facture
              </Button>
            }
          />
        </div>
        <EmptyableTable empty={client.invoices.length === 0} message="Aucune facture pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Réglé</TableHead>
              <TableHead>Reste dû</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-36" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.invoices.map((invoice) => {
              const state = computeInvoicePaymentState(invoice);
              const effective = effectiveInvoiceStatus(invoice);
              const canSettle = state.remaining > 0 && effective !== "CREDITED" && effective !== "CANCELLED";
              const detailRows = [
                ...invoice.payments.map((payment) => ({
                  key: `p-${payment.id}`,
                  date: payment.receivedAt,
                  label: `Paiement ${PAYMENT_METHOD_LABELS[payment.method] ?? payment.method} — ${formatCurrency(payment.amount)}`,
                  note: payment.note,
                  action: (
                    <DeleteIconButton
                      action={deletePaymentAction.bind(null, client.id, payment.id)}
                      confirmMessage="Supprimer ce paiement ?"
                    />
                  ),
                })),
                ...invoice.creditNotes.map((creditNote) => ({
                  key: `c-${creditNote.id}`,
                  date: creditNote.issueDate,
                  label: `Avoir ${creditNote.number} — − ${formatCurrency(creditNote.amount)}`,
                  note: creditNote.reason,
                  action: (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="PDF de l'avoir"
                        render={<Link href={`/print/credit-notes/${creditNote.id}`} target="_blank" />}
                        nativeButton={false}
                      >
                        <FileDown className="size-4" />
                      </Button>
                      <DeleteIconButton
                        action={deleteCreditNoteAction.bind(null, client.id, creditNote.id)}
                        confirmMessage="Supprimer cet avoir ?"
                      />
                    </div>
                  ),
                })),
              ];

              return (
                <Fragment key={invoice.id}>
                  <TableRow>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{invoice.number}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {state.paid > 0 ? formatCurrency(state.paid) : "—"}
                    </TableCell>
                    <TableCell className={state.isOverdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                      {state.remaining > 0 ? formatCurrency(state.remaining) : "—"}
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <StatusBadge meta={invoiceStatusMeta[effective] ?? invoiceStatusMeta[invoice.status]} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canSettle && (
                          <>
                            <PaymentDialog
                              clientId={client.id}
                              invoiceId={invoice.id}
                              invoiceNumber={invoice.number}
                              remaining={state.remaining}
                              trigger={
                                <Button variant="ghost" size="icon-sm" title="Enregistrer un paiement">
                                  <Coins className="size-4" />
                                </Button>
                              }
                            />
                            <MarkDoneButton
                              action={markInvoicePaidAction.bind(null, client.id, invoice.id)}
                              title="Solder la facture"
                            />
                          </>
                        )}
                        {effective !== "CANCELLED" && (
                          <CreditNoteDialog
                            clientId={client.id}
                            invoice={invoice}
                            vatEnabled={vatEnabled}
                            vatRate={vatRate}
                            trigger={
                              <Button variant="ghost" size="icon-sm" title="Émettre un avoir">
                                <Undo2 className="size-4" />
                              </Button>
                            }
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Télécharger le PDF"
                          render={<Link href={`/print/invoices/${invoice.id}`} target="_blank" />}
                          nativeButton={false}
                        >
                          <FileDown className="size-4" />
                        </Button>
                        <InvoiceDialog
                          clientId={client.id}
                          vatEnabled={vatEnabled}
                          vatRate={vatRate}
                          catalog={catalog}
                          invoice={invoice}
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteIconButton
                          action={deleteInvoiceAction.bind(null, client.id, invoice.id)}
                          confirmMessage="Supprimer cette facture ?"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  {detailRows.length > 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="bg-muted/30 py-2">
                        <div className="flex flex-col gap-1 text-xs">
                          {detailRows.map((row) => (
                            <div key={row.key} className="flex items-center gap-2">
                              <span className="text-muted-foreground whitespace-nowrap">{formatDate(row.date)}</span>
                              <span>{row.label}</span>
                              {row.note ? <span className="text-muted-foreground">· {row.note}</span> : null}
                              <span className="ml-auto">{row.action}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="credit-notes">
        <EmptyableTable empty={client.creditNotes.length === 0} message="Aucun avoir pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Facture</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.creditNotes.map((creditNote) => (
              <TableRow key={creditNote.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">{creditNote.number}</TableCell>
                <TableCell className="font-mono text-xs">{creditNote.invoice?.number ?? "—"}</TableCell>
                <TableCell className="max-w-[16rem] truncate text-muted-foreground">{creditNote.reason ?? "—"}</TableCell>
                <TableCell className="text-red-600 dark:text-red-400">− {formatCurrency(creditNote.amount)}</TableCell>
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
                      action={deleteCreditNoteAction.bind(null, client.id, creditNote.id)}
                      confirmMessage="Supprimer cet avoir ?"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="notes">
        <div className="rounded-lg border p-4">
          {client.notes ? (
            <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune note interne. Modifiez la fiche client pour en ajouter.
            </p>
          )}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <span>Total facturé : {formatCurrency(financials.totalInvoiced)}</span>
          <span>Total encaissé : {formatCurrency(financials.totalPaid)}</span>
          <span>Reste dû : {formatCurrency(financials.totalUnpaid)}</span>
        </div>
      </TabsContent>

      <TabsContent value="history">
        {client.activityLogs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucun historique pour ce client.</p>
        ) : (
          <ol className="flex flex-col gap-3 border-l pl-4">
            {client.activityLogs.map((entry) => (
              <li key={entry.id} className="text-sm">
                <span className="font-medium">{formatDate(entry.createdAt)}</span>
                <span className="text-muted-foreground"> — {entry.message}</span>
              </li>
            ))}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyableTable({
  empty,
  message,
  children,
}: {
  empty: boolean;
  message: string;
  children: React.ReactNode;
}) {
  if (empty) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{message}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-max">{children}</Table>
    </div>
  );
}

function ConvertQuoteButton({ action }: { action: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      title="Convertir en facture"
      onClick={() => startTransition(() => action())}
    >
      <ArrowRightCircle className="size-4" />
    </Button>
  );
}
