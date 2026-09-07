import { z } from "zod";

export const organizationBillingSchema = z.object({
  address: z.string().trim().optional().or(z.literal("")),
  siret: z.string().trim().optional().or(z.literal("")),
  vatNumber: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  contactEmail: z.union([z.literal(""), z.email("Email invalide.")]).optional(),
  bankName: z.string().trim().optional().or(z.literal("")),
  iban: z.string().trim().optional().or(z.literal("")),
  bic: z.string().trim().optional().or(z.literal("")),
  paymentTerms: z.string().trim().optional().or(z.literal("")),
  vatEnabled: z.string().optional(),
  vatRate: z.string().trim().min(1, "Le taux de TVA est requis."),
});

export type OrganizationBillingValues = z.infer<typeof organizationBillingSchema>;
