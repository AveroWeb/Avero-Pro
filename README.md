# Avero Pro

SaaS en libre-service pour les TPE et PME : présence en ligne (site + fiche Google + avis),
carnet client, devis et facturation — le tout dans une seule interface simple.

Construit à partir de la base technique d'Avero (outil interne d'agence), adapté pour être
utilisé directement par les TPE/PME elles-mêmes plutôt que par une agence pour leurs clients.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + TypeScript
- [PostgreSQL](https://www.postgresql.org/) via [Prisma 7](https://www.prisma.io/) (driver adapter `@prisma/adapter-pg`)
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Base UI)
- [Auth.js v5](https://authjs.dev/) (Credentials + JWT), multi-tenant par organisation (= une entreprise)

## Mise en route

### 1. Base de données

Ce projet utilise PostgreSQL. En développement, [Neon](https://neon.tech) (gratuit, sans installation) est recommandé :

1. Crée un compte sur [neon.tech](https://neon.tech) et un projet.
2. Copie la chaîne de connexion (`postgresql://...`).

### 2. Variables d'environnement

Copie `.env.example` vers `.env` et renseigne :

```bash
cp .env.example .env
```

- `DATABASE_URL` — ta chaîne de connexion PostgreSQL.
- `AUTH_SECRET` — génère-en un avec `openssl rand -base64 32`.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` / `SEED_ORG_NAME` — utilisés uniquement par le script de seed pour créer un compte de démo.

### 3. Installation, migrations et données de démo

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Deux façons d'entrer :

- **Créer un compte** sur `/signup` (parcours normal d'un nouvel utilisateur — une entreprise = un compte).
- Ou se connecter avec le compte de démo créé par le seed (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## Scripts utiles

```bash
npm run dev        # serveur de développement
npm run build       # build de production
npm run lint         # ESLint
npx tsc --noEmit     # vérification TypeScript
npx prisma studio    # explorateur de données
```

## Fonctionnalités V1

- ✅ **Inscription en libre-service** : une entreprise crée son compte et devient sa propre organisation.
- ✅ **Présence en ligne** : mon site (statut, URL), ma fiche Google (note, avis), avis clients (ajout + réponse).
- ✅ **Clients (CRM simple)** : carnet client, statut, notes, historique.
- ✅ **Devis & factures** : création, lignes, TVA, export PDF, conversion devis → facture.
- ✅ **Dashboard** : clients actifs, devis en attente, factures impayées, note Google, avis sans réponse.
- ✅ **Paramètres** : informations de facturation (SIRET, TVA, IBAN...), membres de l'équipe.

## Pistes pour la suite

- Récupération automatique de la fiche Google Business Profile et des avis (au lieu d'une saisie manuelle).
- Générateur de site vitrine intégré plutôt qu'un simple lien externe.
- Rappels automatiques (factures en retard, devis qui expirent, avis sans réponse) par email.
- Abonnement payant à Avero Pro lui-même (aujourd'hui hors périmètre V1).
