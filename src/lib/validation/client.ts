import { z } from "zod";

export const clientSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est requis."),
  contactName: z.string().trim().optional().or(z.literal("")),
  email: z.union([z.literal(""), z.email("Email invalide.")]).optional(),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "PROSPECT", "INACTIVE"]),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
