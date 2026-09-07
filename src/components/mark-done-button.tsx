"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkDoneButton({ action, title }: { action: () => Promise<void>; title: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      title={title}
      onClick={() => startTransition(() => action())}
    >
      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
    </Button>
  );
}
