import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Créer mon compte — Avero Pro",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Avero Pro</h1>
          <p className="text-sm text-muted-foreground">
            Votre présence en ligne et vos clients, gérés simplement.
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
