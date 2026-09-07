import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneClass: Record<string, string> = {
  default: "bg-muted text-foreground",
  danger: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
};

export function KpiCard({
  title,
  value,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
          <p className="truncate text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
