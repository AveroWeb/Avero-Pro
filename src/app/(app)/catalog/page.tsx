import type { Metadata } from "next";
import { Plus, Pencil } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { listCatalogItems } from "@/lib/queries/catalog";
import { toNumber, formatCurrencyPrecise } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { CatalogItemDialog } from "./catalog-item-dialog";
import { deleteCatalogItemAction } from "./actions";

export const metadata: Metadata = { title: "Catalogue — Avero Pro" };

export default async function CatalogPage() {
  const user = await requireStaff();
  const items = await listCatalogItems(user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            Vos produits et prestations réutilisables, insérables en un clic dans un devis ou une facture.
          </p>
        </div>
        <CatalogItemDialog
          trigger={
            <Button size="sm">
              <Plus /> Nouvel article
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Prix unitaire HT</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun article. Ajoute tes prestations récurrentes pour gagner du temps.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const serialized = {
                    id: item.id,
                    label: item.label,
                    description: item.description,
                    unitPrice: toNumber(item.unitPrice),
                    unit: item.unit,
                    active: item.active,
                  };
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrencyPrecise(item.unitPrice)}</TableCell>
                      <TableCell className="text-muted-foreground">{item.unit ?? "—"}</TableCell>
                      <TableCell>
                        {item.active ? (
                          <Badge className="border-transparent bg-emerald-100 font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                            Actif
                          </Badge>
                        ) : (
                          <Badge className="border-transparent bg-zinc-100 font-medium text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400">
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CatalogItemDialog
                            item={serialized}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Pencil className="size-4" />
                              </Button>
                            }
                          />
                          <DeleteIconButton
                            action={deleteCatalogItemAction.bind(null, item.id)}
                            confirmMessage={`Supprimer « ${item.label} » du catalogue ?`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
