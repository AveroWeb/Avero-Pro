import { z } from "zod";

export const siteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  url: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ONLINE", "MAINTENANCE", "OFFLINE", "NOT_LAUNCHED"]),
  launchedAt: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type SiteFormValues = z.infer<typeof siteSchema>;
