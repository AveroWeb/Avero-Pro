import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { StatusBadge, roleMeta } from "@/components/status-badge";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { MemberDialog } from "./member-dialog";
import { BillingForm } from "./billing-form";
import { deleteMemberAction } from "./actions";

export const metadata: Metadata = { title: "Paramètres — Avero Pro" };

export default async function SettingsPage() {
  const user = await requireStaff();
  const [organization, teamMembers] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.organizationId } }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, role: { in: ["ADMIN", "MEMBER"] } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Informations sur votre compte et votre entreprise.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mon entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Nom" value={organization?.name ?? "—"} />
          <Row label="Activité" value={organization?.sector ?? "—"} />
          <Row label="Créée le" value={formatDate(organization?.createdAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Nom" value={user.name ?? "—"} />
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Rôle" value={<StatusBadge meta={roleMeta[user.role]} />} />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Facturation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ces informations apparaissent sur les devis et factures générés (PDF).
            </p>
          </CardHeader>
          <CardContent>
            <BillingForm
              billing={{
                address: organization?.address ?? null,
                siret: organization?.siret ?? null,
                vatNumber: organization?.vatNumber ?? null,
                phone: organization?.phone ?? null,
                contactEmail: organization?.contactEmail ?? null,
                bankName: organization?.bankName ?? null,
                iban: organization?.iban ?? null,
                bic: organization?.bic ?? null,
                paymentTerms: organization?.paymentTerms ?? null,
                vatEnabled: organization?.vatEnabled ?? true,
                vatRate: organization ? Number(organization.vatRate) : 20,
                legalForm: organization?.legalForm ?? null,
                shareCapital: organization?.shareCapital ?? null,
                rcsCity: organization?.rcsCity ?? null,
                latePenaltyText: organization?.latePenaltyText ?? null,
                recoveryIndemnity: organization ? Number(organization.recoveryIndemnity) : 40,
                discountTerms: organization?.discountTerms ?? null,
                quoteValidityDays: organization?.quoteValidityDays ?? 30,
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Membres de l&apos;équipe</CardTitle>
          {isAdmin && (
            <MemberDialog
              trigger={
                <Button size="sm">
                  <Plus /> Ajouter un membre
                </Button>
              }
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge meta={roleMeta[member.role]} />
                {isAdmin && member.id !== user.id && (
                  <DeleteIconButton
                    action={deleteMemberAction.bind(null, member.id)}
                    confirmMessage={`Retirer ${member.name} de l'équipe ?`}
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
