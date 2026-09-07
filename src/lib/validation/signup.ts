import { z } from "zod";

export const signupSchema = z.object({
  organizationName: z.string().trim().min(1, "Le nom de votre entreprise est requis."),
  sector: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Votre nom est requis."),
  email: z.email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
