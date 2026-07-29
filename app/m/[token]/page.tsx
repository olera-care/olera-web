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
import { familyBenefitsFacts } from "@/lib/family-comms/benefits-guidance.server";
import {
  hasEligibilityFacts,
  incomeLimitFromTable,
  loadSbfEligibility,
  rankProgramsForFamily,
} from "@/lib/benefits/eligibility.server";
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
  const cascade = readBenefitsCascade(meta);
  // Letter/page coherence (TJ design 2026-07-29): once a navigator letter went
  // out naming a program, this page pins its hero to THAT program.
  const pinnedProgramId =
    cascade.first_step_sent_at && cascade.first_step_program_id
      ? cascade.first_step_program_id
      : null;

  // ── Phase 3: real facts re-rank the matches ──────────────────────────
  // When the family has given eligibility facts (age band / Medicaid /
  // income band, from the enrichment round or this page's gap chips), the
  // scored engine's rules reorder the list and demote ruled-out programs
  // into a labeled group. No facts → the care-need order stands untouched.
  const facts = familyBenefitsFacts(bundle.profile);
  let matches = bundle.matchedPrograms;
  let ruledOut: { program: (typeof matches)[number]; reason: string }[] = [];
  if (hasEligibilityFacts(facts)) {
    try {
      const sbfRows = await loadSbfEligibility(db, bundle.token.state_code);
      const ranked = rankProgramsForFamily(
        bundle.matchedPrograms,
        (p) => ({
          name: p.name,
          ageRequirement: p.structuredEligibility?.ageRequirement,
          eligibilitySummary: p.structuredEligibility?.summary,
          incomeLimitSingle: incomeLimitFromTable(p.structuredEligibility?.incomeTable),
        }),
        sbfRows,
        facts,
        bundle.stateName,
      );
      matches = ranked.kept.map((r) => r.item);
      ruledOut = ranked.ruledOut.map((r) => ({
        program: r.item,
        reason: r.verdict.reason || "Not a match for your situation",
      }));
      // Never contradict a sent letter: if a late-arriving fact ruled out the
      // program TJ's letter named, keep it in the visible list — a hero that
      // says "call X" above a bucket that says "X is probably not a fit"
      // is disorientation at the exact moment we promised orientation.
      if (pinnedProgramId) {
        const idx = ruledOut.findIndex((r) => r.program.id === pinnedProgramId);
        if (idx >= 0) {
          matches = [ruledOut[idx].program, ...matches];
          ruledOut.splice(idx, 1);
        }
      }
    } catch (err) {
      // Ranking is an enhancement — the unranked list is never worth a 500.
      console.error("[/m] eligibility re-rank failed:", err);
    }
  }

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
        facts,
        pin: pinnedProgramId
          ? { programId: pinnedProgramId, stateId: cascade.first_step_state_id || null }
          : null,
      });
      // "Up next" for the living journey — computed eagerly because the client
      // flips to done optimistically and needs it without a reload.
      if (firstStep) {
        nextStep = await selectFirstStepProgram(db, {
          accountId: profileRow.account_id,
          stateAbbrev: bundle.token.state_code,
          exclude: [firstStep.programId],
          facts,
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
      matches={matches}
      ruledOut={ruledOut}
      profileId={bundle.profile.id}
      knownFacts={{
        age: facts.age,
        medicaidStatus: facts.medicaidStatus,
        incomeBand: facts.incomeBand,
      }}
      firstStep={firstStep}
      callScript={firstStep ? buildCallScript(firstStep.shortName, relationship) : null}
      cascade={cascade}
      textTjNumber={meta.sms_consent ? process.env.TWILIO_FROM_NUMBER || null : null}
    />
  );
}
