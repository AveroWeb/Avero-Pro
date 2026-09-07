import type { Metadata } from "next";
import { Plus, Pencil, ExternalLink, Star, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { StatusBadge, siteStatusMeta, reviewSourceMeta } from "@/components/status-badge";
import { requireStaff } from "@/lib/session";
import { getPresenceOverview } from "@/lib/queries/presence";
import { formatDate, formatDateTime } from "@/lib/format";
import { SiteDialog } from "./site-dialog";
import { GoogleListingForm } from "./google-listing-form";
import { ReviewDialog } from "./review-dialog";
import { ReviewResponseForm } from "./review-response-form";
import { deleteSiteAction, deleteReviewAction } from "./actions";

export const metadata: Metadata = { title: "Présence en ligne — Avero Pro" };

export default async function PresencePage() {
  const user = await requireStaff();
  const { sites, googleListing, reviews, reviewStats } = await getPresenceOverview(user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Présence en ligne</h1>
        <p className="text-sm text-muted-foreground">
          Mon site, ma fiche Google et mes avis clients, au même endroit.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Mon site</CardTitle>
          <SiteDialog
            trigger={
              <Button size="sm">
                <Plus /> Ajouter un site
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun site enregistré. Ajoute ton site vitrine ou ta boutique en ligne.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {sites.map((site) => (
                <div key={site.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{site.name}</span>
                      <StatusBadge meta={siteStatusMeta[site.status]} />
                    </div>
                    {site.url && (
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                      >
                        {site.url} <ExternalLink className="size-3" />
                      </a>
                    )}
                    {site.launchedAt && (
                      <p className="text-xs text-muted-foreground">Mis en ligne le {formatDate(site.launchedAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <SiteDialog
                      site={site}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteIconButton
                      action={deleteSiteAction.bind(null, site.id)}
                      confirmMessage={`Supprimer "${site.name}" ?`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ma fiche Google</CardTitle>
          <p className="text-sm text-muted-foreground">
            Renseigne ces informations manuellement pour suivre ta note et ton nombre d&apos;avis dans le temps.
          </p>
        </CardHeader>
        <CardContent>
          <GoogleListingForm listing={googleListing} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Avis clients</CardTitle>
            <p className="text-sm text-muted-foreground">
              {reviewStats.total === 0
                ? "Aucun avis enregistré."
                : `${reviewStats.total} avis · note moyenne ${reviewStats.averageRating?.toFixed(1)}/5 · ${reviewStats.unanswered} sans réponse`}
            </p>
          </div>
          <ReviewDialog
            trigger={
              <Button size="sm">
                <Plus /> Ajouter un avis
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun avis pour le moment.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3.5 ${i < review.rating ? "fill-current" : ""}`} />
                        ))}
                      </span>
                      <StatusBadge meta={reviewSourceMeta[review.source]} />
                      {review.authorName && <span className="text-sm font-medium">{review.authorName}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatDateTime(review.receivedAt)}</span>
                      <DeleteIconButton
                        action={deleteReviewAction.bind(null, review.id)}
                        confirmMessage="Supprimer cet avis ?"
                      />
                    </div>
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
                  {review.response && (
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs">
                      <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <p>{review.response}</p>
                    </div>
                  )}
                  <ReviewResponseForm reviewId={review.id} existingResponse={review.response} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
