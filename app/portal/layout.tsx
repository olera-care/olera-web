"use client";

import type { ReactNode } from "react";

// "use client" is required so child pages using useSearchParams() have a
// client boundary (Next.js requires Suspense otherwise during static export).
// Each portal page handles its own auth state via useAuth() — no layout-level
// auth gate to avoid blocking children and creating a loading waterfall.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
