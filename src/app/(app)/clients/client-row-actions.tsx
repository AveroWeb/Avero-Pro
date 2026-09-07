"use client";

import { RowActions } from "@/components/row-actions";
import { deleteClientAction } from "./actions";

export function ClientRowActions({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  return (
    <RowActions
      editHref={`/clients/${clientId}/edit`}
      deleteAction={deleteClientAction.bind(null, clientId)}
      deleteConfirmMessage={`Supprimer le client « ${clientName} » ? Ses devis et factures seront aussi supprimés. Cette action est irréversible.`}
    />
  );
}
