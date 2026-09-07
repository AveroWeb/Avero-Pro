"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { clientSchema } from "@/lib/validation/client";

function parseClientForm(formData: FormData) {
  return clientSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  });
}

export async function createClientAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireStaff();

  let clientId: string;
  try {
    const data = parseClientForm(formData);
    const client = await prisma.client.create({
      data: {
        organizationId: user.organizationId,
        companyName: data.companyName,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        status: data.status,
      },
    });
    clientId = client.id;
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId: client.id,
        userId: user.id,
        type: "CLIENT_CREATED",
        message: "Client créé.",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? "Données invalides.";
    }
    throw error;
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect(`/clients/${clientId}`);
}

export async function updateClientAction(
  clientId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const user = await requireStaff();

  try {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!existing) return "Client introuvable.";

    const data = parseClientForm(formData);
    await prisma.client.update({
      where: { id: clientId },
      data: {
        companyName: data.companyName,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        status: data.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? "Données invalides.";
    }
    throw error;
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  redirect(`/clients/${clientId}`);
}

export async function deleteClientAction(clientId: string) {
  const user = await requireStaff();

  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!existing) return;

  // Quotes, invoices and activity logs all cascade-delete with the client (see schema).
  await prisma.client.delete({ where: { id: clientId } });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect("/clients");
}
