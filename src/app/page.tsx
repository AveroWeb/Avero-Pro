import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Star, Users, FileSignature, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Avero Pro — Votre présence en ligne, simplement",
};

const FEATURES = [
  {
    icon: Globe,
    title: "Votre présence en ligne",
    description: "Votre site et votre fiche Google au même endroit, à jour en quelques clics.",
  },
  {
    icon: Star,
    title: "Vos avis clients",
    description: "Suivez votre note, vos avis, et répondez sans oublier personne.",
  },
  {
    icon: Users,
    title: "Vos clients",
    description: "Un carnet client simple : coordonnées, historique, notes.",
  },
  {
    icon: FileSignature,
    title: "Devis & factures",
    description: "Créez un devis, transformez-le en facture en un clic, exportez le PDF.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">Avero Pro</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
            Connexion
          </Button>
          <Button render={<Link href="/signup" />} nativeButton={false}>
            Créer mon compte
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-16 px-6 py-16 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Votre présence en ligne et vos clients, gérés simplement.
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Avero Pro réunit votre site, votre fiche Google, vos avis clients, votre carnet client et
            votre facturation — pensé pour les TPE et PME qui n&apos;ont pas de temps à perdre.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" render={<Link href="/signup" />} nativeButton={false}>
              Créer mon compte gratuitement
              <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col items-start gap-2 rounded-lg border p-5 text-left">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <p className="font-medium">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        Avero Pro
      </footer>
    </div>
  );
}
