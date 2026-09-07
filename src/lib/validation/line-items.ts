import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "La description est requise."),
  quantity: z.coerce.number().positive("La quantité doit être positive."),
  unitPrice: z.coerce.number().min(0, "Le prix unitaire doit être positif ou nul."),
});

export const lineItemsSchema = z.array(lineItemSchema).min(1, "Ajoute au moins une ligne.");

export type LineItemValues = z.infer<typeof lineItemSchema>;

export function computeLineItemsTotal(items: LineItemValues[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
