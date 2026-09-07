import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type BadgeMeta = { label: string; className: string };

export function StatusBadge({ meta }: { meta: BadgeMeta }) {
  return (
    <Badge className={cn("border-transparent font-medium", meta.className)}>
      {meta.label}
    </Badge>
  );
}

const emerald = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
const blue = "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400";
const amber = "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
const red = "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
const zinc = "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400";
const violet = "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400";

export const clientStatusMeta: Record<string, BadgeMeta> = {
  ACTIVE: { label: "Actif", className: emerald },
  PROSPECT: { label: "Prospect", className: blue },
  INACTIVE: { label: "Inactif", className: zinc },
};

export const siteStatusMeta: Record<string, BadgeMeta> = {
  ONLINE: { label: "En ligne", className: emerald },
  MAINTENANCE: { label: "Maintenance", className: amber },
  OFFLINE: { label: "Hors ligne", className: red },
  NOT_LAUNCHED: { label: "Pas encore en ligne", className: zinc },
};

export const reviewSourceMeta: Record<string, BadgeMeta> = {
  GOOGLE: { label: "Google", className: blue },
  FACEBOOK: { label: "Facebook", className: violet },
  OTHER: { label: "Autre", className: zinc },
};

export const quoteStatusMeta: Record<string, BadgeMeta> = {
  DRAFT: { label: "Brouillon", className: zinc },
  SENT: { label: "Envoyé", className: blue },
  ACCEPTED: { label: "Accepté", className: emerald },
  REJECTED: { label: "Refusé", className: red },
  EXPIRED: { label: "Expiré", className: amber },
};

export const invoiceStatusMeta: Record<string, BadgeMeta> = {
  PAID: { label: "Payée", className: emerald },
  UNPAID: { label: "Impayée", className: amber },
  OVERDUE: { label: "En retard", className: red },
  CANCELLED: { label: "Annulée", className: zinc },
};

export const roleMeta: Record<string, BadgeMeta> = {
  ADMIN: { label: "Administrateur", className: violet },
  MEMBER: { label: "Membre", className: blue },
};
