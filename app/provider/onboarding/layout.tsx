import type { Metadata } from "next";

/**
 * /provider/onboarding is a claim/onboarding flow for providers, reached from
 * the "Manage this page" links on provider pages. It has no search value and
 * every provider page links to it, so Googlebot was spending crawl budget on
 * tens of thousands of these URLs (Search Console "Alternate page with proper
 * canonical", 32K in July 2026, 83% onboarding URLs).
 *
 * The page below is a client component and cannot export metadata, so this
 * layout's `robots` is the effective value for the route. Paired with a
 * robots.txt Disallow in app/robots.ts and rel="nofollow" on the links that
 * point here (components/providers/ClaimBadge.tsx, app/provider/[slug]/page.tsx).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProviderOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
