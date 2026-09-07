import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "../../client-form";
import { updateClientAction } from "../../actions";

export const metadata: Metadata = {
  title: "Modifier le client — Avero Pro",
};

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!client) notFound();

  const action = updateClientAction.bind(null, client.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Modifier {client.companyName}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ClientForm action={action} submitLabel="Enregistrer" defaultValues={client} />
        </CardContent>
      </Card>
    </div>
  );
}
