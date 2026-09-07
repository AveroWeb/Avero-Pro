"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // The dashboard is the home page — nothing to go back to.
  if (pathname === "/" || pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);
  // Sub-pages fall back to their section root (/clients/x/edit -> /clients);
  // top-level category pages fall back to the dashboard.
  const fallback = segments.length <= 1 ? "/dashboard" : `/${segments[0]}`;

  function handleBack() {
    // Use the real history stack when we have one; otherwise (direct link, new
    // tab, page reload) fall back to a sensible parent page.
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
      <ArrowLeft className="size-4" />
      Retour
    </Button>
  );
}
