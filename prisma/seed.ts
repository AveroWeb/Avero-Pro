import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => daysFromNow(-days);

async function main() {
  const orgName = process.env.SEED_ORG_NAME ?? "Ma Boulangerie";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin";

  console.log(`Seeding organization "${orgName}"...`);

  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: orgName,
      slug: "demo",
      sector: "Boulangerie",
      address: "5 place du Marché, 12000 Rodez",
      siret: "123 456 789 00012",
      phone: "+33 5 65 12 34 56",
      contactEmail: adminEmail,
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      organizationId: org.id,
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "ADMIN",
    },
  });

  // --- Clients (mes clients) ------------------------------------------------
  const dupont = await prisma.client.create({
    data: {
      organizationId: org.id,
      companyName: "Restaurant Le Dupont",
      contactName: "Jean Dupont",
      email: "jean.dupont@example.fr",
      phone: "+33 6 12 34 56 78",
      address: "12 rue de la République, 12000 Rodez",
      status: "ACTIVE",
      notes: "Client régulier, commande le pain tous les matins pour son restaurant.",
      createdAt: daysAgo(210),
    },
  });

  const mairie = await prisma.client.create({
    data: {
      organizationId: org.id,
      companyName: "Mairie de Rodez",
      contactName: "Sophie Martin",
      email: "sophie.martin@mairie-exemple.fr",
      phone: "+33 6 98 76 54 32",
      status: "ACTIVE",
      notes: "Commande viennoiseries pour les événements municipaux.",
      createdAt: daysAgo(140),
    },
  });

  const atelier = await prisma.client.create({
    data: {
      organizationId: org.id,
      companyName: "Atelier Créatif",
      contactName: "Lucas Bernard",
      status: "PROSPECT",
      notes: "Intéressé par un contrat de livraison hebdomadaire, devis envoyé.",
      createdAt: daysAgo(10),
    },
  });

  // --- Présence en ligne ----------------------------------------------------
  await prisma.site.create({
    data: {
      organizationId: org.id,
      name: "Site vitrine",
      url: "https://ma-boulangerie.fr",
      status: "ONLINE",
      launchedAt: daysAgo(200),
    },
  });

  await prisma.googleListing.create({
    data: {
      organizationId: org.id,
      businessName: orgName,
      mapsUrl: "https://maps.google.com/?q=Ma+Boulangerie+Rodez",
      category: "Boulangerie",
      rating: 4.6,
      reviewCount: 87,
      lastCheckedAt: daysAgo(2),
    },
  });

  await prisma.review.createMany({
    data: [
      {
        organizationId: org.id,
        source: "GOOGLE",
        authorName: "Marie D.",
        rating: 5,
        comment: "Excellent pain, toujours frais et une équipe adorable !",
        receivedAt: daysAgo(3),
      },
      {
        organizationId: org.id,
        source: "GOOGLE",
        authorName: "Paul L.",
        rating: 4,
        comment: "Très bon mais parfois beaucoup d'attente le samedi matin.",
        receivedAt: daysAgo(8),
      },
      {
        organizationId: org.id,
        source: "FACEBOOK",
        authorName: "Claire B.",
        rating: 2,
        comment: "Déçue par la dernière commande de gâteau, pas assez frais.",
        receivedAt: daysAgo(1),
      },
    ],
  });

  // --- Devis & factures -------------------------------------------------------
  const quote = await prisma.quote.create({
    data: {
      organizationId: org.id,
      clientId: atelier.id,
      title: "Livraison hebdomadaire de viennoiseries",
      status: "SENT",
      issueDate: daysAgo(5),
      validUntil: daysFromNow(10),
      lineItems: {
        create: [{ description: "Livraison viennoiseries (12 semaines)", quantity: 12, unitPrice: 45, position: 0 }],
      },
      amount: 540,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: dupont.id,
      title: "Commande de pain — janvier",
      status: "UNPAID",
      issueDate: daysAgo(20),
      dueDate: daysAgo(-10),
      lineItems: {
        create: [{ description: "Pains et baguettes, livraison quotidienne", quantity: 1, unitPrice: 320, position: 0 }],
      },
      amount: 320,
    },
  });

  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: mairie.id,
      title: "Viennoiseries — réception municipale",
      status: "PAID",
      issueDate: daysAgo(45),
      dueDate: daysAgo(30),
      paidAt: daysAgo(32),
      lineItems: {
        create: [{ description: "Plateau de viennoiseries (50 pers.)", quantity: 1, unitPrice: 180, position: 0 }],
      },
      amount: 180,
    },
  });

  // --- Activity log (client history) --------------------------------------
  await prisma.activityLog.createMany({
    data: [
      { organizationId: org.id, clientId: dupont.id, type: "CLIENT_CREATED", message: "Client créé.", createdAt: daysAgo(210) },
      { organizationId: org.id, clientId: mairie.id, type: "CLIENT_CREATED", message: "Client créé.", createdAt: daysAgo(140) },
      { organizationId: org.id, clientId: atelier.id, type: "CLIENT_CREATED", message: "Client (prospect) créé.", createdAt: daysAgo(10) },
      { organizationId: org.id, clientId: atelier.id, type: "QUOTE_SENT", message: `Devis envoyé : ${quote.title}.`, createdAt: daysAgo(5) },
      { organizationId: org.id, clientId: dupont.id, type: "INVOICE_CREATED", message: `Facture créée : ${invoice.title}.`, createdAt: daysAgo(20) },
    ],
  });

  console.log("Seed terminé.");
  console.log(`Connexion admin : ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
