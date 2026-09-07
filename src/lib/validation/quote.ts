import { z } from "zod";

export const quoteSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis."),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
  issueDate: z.string().trim().min(1, "La date d'émission est requise."),
  validUntil: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;
