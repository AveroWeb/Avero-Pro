"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Supprimer",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      className="text-destructive hover:text-destructive"
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(() => action());
        }
      }}
    >
      <Trash2 className="size-4" />
      {label}
    </Button>
  );
}
