import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — Avero Pro",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Avero Pro</h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre espace
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            Créer mon compte
          </Link>
        </p>
      </div>
    </div>
  );
}
