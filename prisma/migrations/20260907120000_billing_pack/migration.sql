-- Billing pack: legal numbering, legal mentions, credit notes, partial payments, catalog.
-- This migration is "expand-safe": new NOT NULL text columns are added nullable,
-- backfilled, then constrained.

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('QUOTE', 'INVOICE', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CARD', 'CASH', 'CHECK', 'OTHER');

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'PARTIAL';
ALTER TYPE "InvoiceStatus" ADD VALUE 'CREDITED';

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'CREDIT_NOTE_ISSUED';

-- AlterTable
ALTER TABLE "Organization"
    ADD COLUMN "discountTerms" TEXT,
    ADD COLUMN "latePenaltyText" TEXT,
    ADD COLUMN "legalForm" TEXT,
    ADD COLUMN "quoteValidityDays" INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN "rcsCity" TEXT,
    ADD COLUMN "recoveryIndemnity" DECIMAL(10,2) NOT NULL DEFAULT 40,
    ADD COLUMN "shareCapital" TEXT;

-- AlterTable: add document numbers as nullable, backfill, then enforce NOT NULL.
ALTER TABLE "Invoice" ADD COLUMN "number" TEXT;
ALTER TABLE "Quote" ADD COLUMN "number" TEXT;

-- Backfill Invoice.number — continuous sequence per organization and per year,
-- ordered by issue date (then creation date, then id for determinism).
WITH numbered AS (
    SELECT
        "id",
        'FAC-' || date_part('year', "issueDate")::int::text || '-' || lpad(
            row_number() OVER (
                PARTITION BY "organizationId", date_part('year', "issueDate")::int
                ORDER BY "issueDate" ASC, "createdAt" ASC, "id" ASC
            )::text,
            4,
            '0'
        ) AS num
    FROM "Invoice"
)
UPDATE "Invoice" i SET "number" = n.num FROM numbered n WHERE i."id" = n."id";

-- Backfill Quote.number.
WITH numbered AS (
    SELECT
        "id",
        'DEV-' || date_part('year', "issueDate")::int::text || '-' || lpad(
            row_number() OVER (
                PARTITION BY "organizationId", date_part('year', "issueDate")::int
                ORDER BY "issueDate" ASC, "createdAt" ASC, "id" ASC
            )::text,
            4,
            '0'
        ) AS num
    FROM "Quote"
)
UPDATE "Quote" q SET "number" = n.num FROM numbered n WHERE q."id" = n."id";

ALTER TABLE "Invoice" ALTER COLUMN "number" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "number" SET NOT NULL;

-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "reason" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNoteLineItem" (
    "id" TEXT NOT NULL,
    "creditNoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CreditNoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- Seed NumberSequence from the numbers just backfilled, so the next allocation
-- continues the sequence instead of colliding.
INSERT INTO "NumberSequence" ("id", "organizationId", "kind", "year", "lastValue", "updatedAt")
SELECT
    'seq-' || "organizationId" || '-invoice-' || date_part('year', "issueDate")::int::text,
    "organizationId",
    'INVOICE'::"DocumentKind",
    date_part('year', "issueDate")::int,
    count(*)::int,
    CURRENT_TIMESTAMP
FROM "Invoice"
GROUP BY "organizationId", date_part('year', "issueDate")::int;

INSERT INTO "NumberSequence" ("id", "organizationId", "kind", "year", "lastValue", "updatedAt")
SELECT
    'seq-' || "organizationId" || '-quote-' || date_part('year', "issueDate")::int::text,
    "organizationId",
    'QUOTE'::"DocumentKind",
    date_part('year', "issueDate")::int,
    count(*)::int,
    CURRENT_TIMESTAMP
FROM "Quote"
GROUP BY "organizationId", date_part('year', "issueDate")::int;

-- CreateIndex
CREATE INDEX "NumberSequence_organizationId_idx" ON "NumberSequence"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_organizationId_kind_year_key" ON "NumberSequence"("organizationId", "kind", "year");

-- CreateIndex
CREATE INDEX "CreditNote_organizationId_idx" ON "CreditNote"("organizationId");

-- CreateIndex
CREATE INDEX "CreditNote_invoiceId_idx" ON "CreditNote"("invoiceId");

-- CreateIndex
CREATE INDEX "CreditNote_clientId_idx" ON "CreditNote"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_organizationId_number_key" ON "CreditNote"("organizationId", "number");

-- CreateIndex
CREATE INDEX "CreditNoteLineItem_creditNoteId_idx" ON "CreditNoteLineItem"("creditNoteId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "CatalogItem_organizationId_idx" ON "CatalogItem"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_number_key" ON "Invoice"("organizationId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_organizationId_number_key" ON "Quote"("organizationId", "number");

-- AddForeignKey
ALTER TABLE "NumberSequence" ADD CONSTRAINT "NumberSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteLineItem" ADD CONSTRAINT "CreditNoteLineItem_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
