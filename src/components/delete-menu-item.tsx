"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function DeleteMenuItem({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(() => action());
        }
      }}
    >
      <Trash2 className="size-4" />
      Supprimer
    </DropdownMenuItem>
  );
}
