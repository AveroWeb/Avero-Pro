"use client";

import { useEffect } from "react";

/** Triggers the browser's print dialog once the page has rendered — the user picks
 * "Enregistrer en PDF" as the destination to get a downloadable file. */
export function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
