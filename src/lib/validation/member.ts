import { z } from "zod";

export const memberSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  email: z.email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
