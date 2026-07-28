import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { lookupResultByToken } from "@/lib/benefits-token";
import type { CareNeed } from "@/lib/benefits/match-care-need";
import BenefitsHome from "@/components/benefits/BenefitsHome";
import {
  selectFirstStepProgram,
  buildCallScript,
  readBenefitsCascade,
  type FirstStepPick,
} from "@/lib/family-comms/benefits-cascade.server";
import { getStateSlug } from "@/lib/program-data";

/**
 * /m/{token} — addressable benefits results page, rebuilt as the family's
 * benefits GUIDE (plans/benefits-results-home.md): recognition of what they
 * told us, the ten-minute first step as the hero (same selection + call
 * script as the day-2 cascade email), the other matches grouped and held.
 *
 * The token IS the auth: anyone with the URL sees the matches. No login
 * wall. This matches the "honest backup" model — ~95% of users won't
 * engage with the welcome email or SMS, but the 5% who return need
 * frictionless access to what they were promised.
 *
 * SEO/privacy:
 *   - noindex: per-user content with PII implications, doesn't belong in search
 *   - referrer-policy: same-origin so the token doesn't leak to outbound clicks
 *     (set in next.config or via headers — TODO if we observe leakage)
 */

export const metadata: Metadata = {
  title: "Your benefits plan | Olera",
  description: "Programs your family may qualify for, and where to start.",
  robots: { index: false, follow: false },
};

// Force dynamic — this route reads from the DB on every request and shouldn't
// be cached at the route level.
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

  const stateSlug = getStateSlug(bundle.token.state_code);
  if (!stateSlug) notFound();

  const meta = bundle.profile.metadata || {};
  const relationship =
    (meta.relationship_to_recipient as string) || (meta.relationship as string) || null;

  // First-step selection reuses the cascade's exact logic (entry-source page →
  // simplest saved match → state start-here list). Needs the account id, which
  // the bundle's profile select doesn't carry — one small extra read.
  let firstStep: FirstStepPick | null = null;
  let nextStep: FirstStepPick | null = null;
  const { data: profileRow } = await db
    .from("business_profiles")
    .select("account_id")
    .eq("id", bundle.profile.id)
    .maybeSingle();

  // Signed-in acknowledgement: the one-click email links authenticate the
  // family, but nothing on the page showed it (TJ QA, 2026-07-28). Show the
  // saved-to-account line only when the session user actually OWNS this
  // profile — a different signed-in user on someone else's token link should
  // never be told it's "their" account.
  let signedIn = false;
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && profileRow?.account_id) {
      const { data: acct } = await db
        .from("accounts")
        .select("user_id")
        .eq("id", profileRow.account_id)
        .maybeSingle();
      signedIn = acct?.user_id === user.id;
    }
  } catch {
    // Session read is best-effort; the page never fails over it.
  }
  if (profileRow?.account_id) {
    try {
      firstStep = await selectFirstStepProgram(db, {
        accountId: profileRow.account_id,
        stateAbbrev: bundle.token.state_code,
      });
      // "Up next" for the living journey — computed eagerly because the client
      // flips to done optimistically and needs it without a reload.
      if (firstStep) {
        nextStep = await selectFirstStepProgram(db, {
          accountId: profileRow.account_id,
          stateAbbrev: bundle.token.state_code,
          exclude: [firstStep.programId],
        });
      }
    } catch (err) {
      // The hero degrades to the top match — never 500 the family's page
      // over a selection failure.
      console.error("[/m] first-step selection failed:", err);
    }
  }

  // "Care Seeker" is the save-results placeholder for families who never gave
  // a name — greeting them "Hi Care" is worse than no name at all.
  const displayName = bundle.profile.display_name?.trim() || "";
  const firstName =
    displayName && displayName.toLowerCase() !== "care seeker"
      ? displayName.split(/\s+/)[0]
      : null;

  return (
    <BenefitsHome
      token={token}
      nextStep={nextStep}
      signedIn={signedIn}
      firstName={firstName}
      stateName={bundle.stateName}
      stateSlug={stateSlug}
      careNeed={bundle.token.care_need as CareNeed}
      relationship={relationship}
      timeline={(meta.timeline as string) || null}
      payments={Array.isArray(meta.payment_methods) ? (meta.payment_methods as string[]) : null}
      matches={bundle.matchedPrograms}
      firstStep={firstStep}
      callScript={firstStep ? buildCallScript(firstStep.shortName, relationship) : null}
      cascade={readBenefitsCascade(meta)}
    />
  );
}
