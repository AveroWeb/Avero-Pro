"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { signupSchema } from "@/lib/validation/signup";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "entreprise";
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug }, select: { id: true } })) {
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
  }
  return slug;
}

export async function signupAction(_prevState: string | undefined, formData: FormData) {
  let email: string;
  let password: string;

  try {
    const data = signupSchema.parse(Object.fromEntries(formData));
    email = data.email.toLowerCase().trim();
    password = data.password;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return "Un compte existe déjà avec cet email.";

    const slug = await uniqueSlug(data.organizationName);
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.organization.create({
      data: {
        name: data.organizationName,
        slug,
        sector: data.sector || null,
        users: {
          create: {
            email,
            name: data.name,
            passwordHash,
            role: "ADMIN",
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? "Données invalides.";
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Compte créé, mais la connexion automatique a échoué. Connectez-vous depuis la page de connexion.";
    }
    throw error;
  }
}
