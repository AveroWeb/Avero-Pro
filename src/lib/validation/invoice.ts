import { z } from "zod";

export const invoiceSchema = z.object({
  title: z.string().trim().optional().or(z.literal("")),
  // Stored status is reconciled from payments/credit notes after every write;
  // this is only a hint from the form, so unknown values fall back gracefully.
  status: z.enum(["PAID", "PARTIAL", "UNPAID", "OVERDUE", "CREDITED", "CANCELLED"]).catch("UNPAID"),
  issueDate: z.string().trim().min(1, "La date d'émission est requise."),
  dueDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
