import { z } from "zod";

export const catalogItemSchema = z.object({
  label: z.string().trim().min(1, "Le libellé est requis."),
  description: z.string().trim().optional().or(z.literal("")),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif ou nul."),
  unit: z.string().trim().optional().or(z.literal("")),
  active: z.string().optional(),
});

export type CatalogItemFormValues = z.infer<typeof catalogItemSchema>;
