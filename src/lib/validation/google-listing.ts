import { z } from "zod";

export const googleListingSchema = z.object({
  businessName: z.string().trim().optional().or(z.literal("")),
  mapsUrl: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
  rating: z.string().trim().optional().or(z.literal("")),
  reviewCount: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type GoogleListingFormValues = z.infer<typeof googleListingSchema>;
