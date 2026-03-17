import type { ReactNode } from "react";

/**
 * Bare layout for /welcome — no navbar, no footer.
 * The welcome page is a standalone onboarding flow.
 */
export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
