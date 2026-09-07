import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getPresenceOverview(organizationId: string) {
  const [sites, googleListing, reviews] = await Promise.all([
    prisma.site.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } }),
    prisma.googleListing.findUnique({ where: { organizationId } }),
    prisma.review.findMany({ where: { organizationId }, orderBy: { receivedAt: "desc" } }),
  ]);

  const answeredCount = reviews.filter((r) => r.respondedAt).length;
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return {
    sites,
    googleListing: googleListing
      ? { ...googleListing, rating: googleListing.rating === null ? null : toNumber(googleListing.rating) }
      : null,
    reviews,
    reviewStats: {
      total: reviews.length,
      answered: answeredCount,
      unanswered: reviews.length - answeredCount,
      averageRating,
    },
  };
}

export type PresenceOverview = Awaited<ReturnType<typeof getPresenceOverview>>;
