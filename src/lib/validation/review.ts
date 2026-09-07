import { z } from "zod";

export const reviewSchema = z.object({
  source: z.enum(["GOOGLE", "FACEBOOK", "OTHER"]),
  authorName: z.string().trim().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1, "La note doit être entre 1 et 5.").max(5, "La note doit être entre 1 et 5."),
  comment: z.string().trim().optional().or(z.literal("")),
  receivedAt: z.string().trim().optional().or(z.literal("")),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

export const reviewResponseSchema = z.object({
  response: z.string().trim().min(1, "La réponse ne peut pas être vide."),
});
