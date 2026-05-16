import type { Metadata } from "next";

/**
 * Care Shifts is a volatile early mockup (mostly hardcoded mock data) that
 * ships to production ahead of being a real product. Until it stabilizes it
 * must NOT be indexed: noindex/nofollow on every /care-shifts/* route via
 * metadata inheritance, paired with a robots.txt Disallow in app/robots.ts.
 *
 * Inheritance note: the child pages either are client components (cannot
 * export metadata) or set only title/description/openGraph (no `robots`),
 * so this layout's `robots` is the effective value for the whole subtree.
 * Remove both this guard and the robots.ts entry together when Care Shifts
 * is real and ready to be discoverable.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CareShiftsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
