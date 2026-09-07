"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteIconButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(() => action());
        }
      }}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
