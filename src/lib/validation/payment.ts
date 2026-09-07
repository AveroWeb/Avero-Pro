import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être positif."),
  method: z.enum(["TRANSFER", "CARD", "CASH", "CHECK", "OTHER"]),
  receivedAt: z.string().trim().min(1, "La date est requise."),
  note: z.string().trim().optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
