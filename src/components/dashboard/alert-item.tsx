import Link from "next/link";
import { cn } from "@/lib/utils";

export type AlertSeverity = "red" | "orange" | "yellow";

export type AlertEntry = {
  id: string;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  href: string;
};

const dotClass: Record<AlertSeverity, string> = {
  red: "bg-red-500",
  orange: "bg-amber-500",
  yellow: "bg-yellow-400",
};

export function AlertItem({ entry }: { entry: AlertEntry }) {
  return (
    <Link
      href={entry.href}
      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
    >
      <span className={cn("size-2 shrink-0 rounded-full", dotClass[entry.severity])} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{entry.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{entry.subtitle}</span>
      </span>
    </Link>
  );
}
