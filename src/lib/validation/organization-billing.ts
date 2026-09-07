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
  legalForm: z.string().trim().optional().or(z.literal("")),
  shareCapital: z.string().trim().optional().or(z.literal("")),
  rcsCity: z.string().trim().optional().or(z.literal("")),
  latePenaltyText: z.string().trim().optional().or(z.literal("")),
  recoveryIndemnity: z.coerce.number().min(0, "L'indemnité doit être positive ou nulle.").default(40),
  discountTerms: z.string().trim().optional().or(z.literal("")),
  quoteValidityDays: z.coerce.number().int().min(1, "La validité doit être d'au moins 1 jour.").default(30),
});

export type OrganizationBillingValues = z.infer<typeof organizationBillingSchema>;
