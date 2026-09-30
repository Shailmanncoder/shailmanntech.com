"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Site chrome (navbar, footer, cursor glow) that the admin area leaves out. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin") ? null : children;
}
