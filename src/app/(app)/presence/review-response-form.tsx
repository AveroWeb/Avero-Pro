"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondReviewAction } from "./actions";

export function ReviewResponseForm({ reviewId, existingResponse }: { reviewId: string; existingResponse: string | null }) {
  const [value, setValue] = useState(existingResponse ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await respondReviewAction(reviewId, formData);
    });
  }

  return (
    <form action={handleSubmit} className="mt-3 flex items-start gap-2">
      <Textarea
        name="response"
        rows={2}
        placeholder="Répondre à ce client…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-sm"
      />
      <Button type="submit" size="sm" variant="outline" disabled={isPending || !value.trim()}>
        {isPending ? "..." : existingResponse ? "Mettre à jour" : "Répondre"}
      </Button>
    </form>
  );
}
