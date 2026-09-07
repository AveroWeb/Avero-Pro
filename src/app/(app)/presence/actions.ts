"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { siteSchema } from "@/lib/validation/site";
import { googleListingSchema } from "@/lib/validation/google-listing";
import { reviewSchema, reviewResponseSchema } from "@/lib/validation/review";

function toDate(value: string) {
  return value ? new Date(value) : null;
}

// --- Mon site ----------------------------------------------------------------

export async function saveSiteAction(siteId: string | null, formData: FormData) {
  const user = await requireStaff();
  const data = siteSchema.parse(Object.fromEntries(formData));

  const payload = {
    name: data.name,
    url: data.url || null,
    status: data.status,
    launchedAt: toDate(data.launchedAt ?? ""),
    notes: data.notes || null,
  };

  if (siteId) {
    const existing = await prisma.site.findFirst({ where: { id: siteId, organizationId: user.organizationId } });
    if (!existing) throw new Error("Site introuvable.");
    await prisma.site.update({ where: { id: siteId }, data: payload });
  } else {
    await prisma.site.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath("/presence");
  revalidatePath("/dashboard");
}

export async function deleteSiteAction(siteId: string) {
  const user = await requireStaff();
  const existing = await prisma.site.findFirst({ where: { id: siteId, organizationId: user.organizationId } });
  if (!existing) return;
  await prisma.site.delete({ where: { id: siteId } });
  revalidatePath("/presence");
  revalidatePath("/dashboard");
}

// --- Fiche Google --------------------------------------------------------------

export async function saveGoogleListingAction(formData: FormData) {
  const user = await requireStaff();
  const data = googleListingSchema.parse(Object.fromEntries(formData));

  const payload = {
    businessName: data.businessName || null,
    mapsUrl: data.mapsUrl || null,
    category: data.category || null,
    rating: data.rating ? Number(data.rating) : null,
    reviewCount: data.reviewCount ? Number(data.reviewCount) : 0,
    notes: data.notes || null,
    lastCheckedAt: new Date(),
  };

  await prisma.googleListing.upsert({
    where: { organizationId: user.organizationId },
    update: payload,
    create: { organizationId: user.organizationId, ...payload },
  });

  revalidatePath("/presence");
  revalidatePath("/dashboard");
}

// --- Avis clients ----------------------------------------------------------------

export async function saveReviewAction(formData: FormData) {
  const user = await requireStaff();
  const data = reviewSchema.parse(Object.fromEntries(formData));

  const review = await prisma.review.create({
    data: {
      organizationId: user.organizationId,
      source: data.source,
      authorName: data.authorName || null,
      rating: data.rating,
      comment: data.comment || null,
      receivedAt: toDate(data.receivedAt ?? "") ?? new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      type: "REVIEW_RECEIVED",
      message: `Nouvel avis ${review.rating}/5${review.authorName ? ` de ${review.authorName}` : ""}.`,
    },
  });

  revalidatePath("/presence");
  revalidatePath("/dashboard");
}

export async function deleteReviewAction(reviewId: string) {
  const user = await requireStaff();
  const existing = await prisma.review.findFirst({ where: { id: reviewId, organizationId: user.organizationId } });
  if (!existing) return;
  await prisma.review.delete({ where: { id: reviewId } });
  revalidatePath("/presence");
  revalidatePath("/dashboard");
}

export async function respondReviewAction(reviewId: string, formData: FormData) {
  const user = await requireStaff();
  const data = reviewResponseSchema.parse(Object.fromEntries(formData));
  const existing = await prisma.review.findFirst({ where: { id: reviewId, organizationId: user.organizationId } });
  if (!existing) throw new Error("Avis introuvable.");

  await prisma.review.update({
    where: { id: reviewId },
    data: { response: data.response, respondedAt: new Date() },
  });

  revalidatePath("/presence");
}
