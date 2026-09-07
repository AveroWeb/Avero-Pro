import { z } from "zod";

export const creditNoteSchema = z.object({
  reason: z.string().trim().optional().or(z.literal("")),
  // "full" copies the invoice lines; "custom" uses the lines from the editor.
  mode: z.enum(["full", "custom"]),
  issueDate: z.string().trim().min(1, "La date est requise."),
});

export type CreditNoteFormValues = z.infer<typeof creditNoteSchema>;
