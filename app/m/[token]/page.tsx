import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { lookupResultByToken } from "@/lib/benefits-token";
import type { CareNeed } from "@/lib/benefits/match-care-need";
import type { MatchableProvider } from "@/lib/benefits/provider-tie-in";
import ResultsSheet from "@/components/benefits/ResultsSheet";
import { getStateSlug } from "@/lib/program-data";

/**
 * /m/{token} — addressable benefits results page.
 *
 * The token IS the auth: anyone with the URL sees the matches. No login
 * wall. This matches the "honest backup" model — ~95% of users won't
 * engage with the welcome email or SMS, but the 5% who return need
 * frictionless access to what they were promised.
 *
 * Component reused from the in-session overlay (mode="page" here).
 *
 * SEO/privacy:
 *   - noindex: per-user content with PII implications, doesn't belong in search
 *   - referrer-policy: same-origin so the token doesn't leak to outbound clicks
 *     (set in next.config or via headers — TODO if we observe leakage)
 */

export const metadata: Metadata = {
  title: "Your benefit matches | Olera",
  description: "Programs your family may qualify for.",
  robots: { index: false, follow: false },
};

// Force dynamic — this route reads from the DB on every request and shouldn't
// be cached at the route level. Per-token caching is handled by Supabase
// query patterns; the React Server Component renders fresh.
export const dynamic = "force-dynamic";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export default async function BenefitsResultsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Token format gate — fail fast on obviously-malformed URLs without a DB hit.
  if (!/^[A-Za-z0-9_-]{16}$/.test(token)) notFound();

  const db = getAdminClient();
  const bundle = await lookupResultByToken(db, token);
  if (!bundle) notFound();

  // If a provider was attached at issuance, pull its display info for the
  // contextual tie-in. Best-effort — null falls back to no tie-in copy.
  let provider: MatchableProvider | null = null;
  if (bundle.token.provider_slug) {
    const { data: providerRow } = await db
      .from("business_profiles")
      .select("display_name, care_types, category")
      .eq("slug", bundle.token.provider_slug)
      .maybeSingle();
    if (providerRow) provider = providerRow as MatchableProvider;
  }

  const stateSlug = getStateSlug(bundle.token.state_code);
  if (!stateSlug) notFound();

  return (
    <ResultsSheet
      mode="page"
      matches={bundle.matchedPrograms}
      matchCount={bundle.token.match_count}
      careNeed={bundle.token.care_need as CareNeed}
      state={{ name: bundle.stateName, slug: stateSlug }}
      provider={provider}
      providerSlug={bundle.token.provider_slug}
      contactChannel={
        (bundle.profile.metadata?.preferred_contact_channel as "email" | "sms" | undefined) ||
        (bundle.profile.email ? "email" : "sms")
      }
      contactDestination={bundle.profile.email || bundle.profile.phone}
    />
  );
}
