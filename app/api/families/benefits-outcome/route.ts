import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateBenefitsOutcomeToken } from "@/lib/claim-tokens";
import { readBenefitsCascade, type BenefitsCascadeMeta } from "@/lib/family-comms/benefits-cascade.server";
import { sendSlackAlert, slackBenefitsWantsHelp } from "@/lib/slack";

/**
 * Family self-report from the benefits check-in email (Benefits Cascade B2).
 *
 * Fired from the /benefits-outcome landing page (no login), keyed by a signed
 * token minted into the email chips. Records how the application is going:
 * 'moving' | 'wants_help' | 'wrong_program'. Every value is forward-looking —
 * this is the check that's an offer, not an audit; the outcome data is the
 * exhaust of helping (see the Phase 2 Redesign in the 2026-07-27 handoff).
 *
 * 'wants_help' is the cascade trigger: Slack ping (awaited — Vercel kills
 * fire-and-forget) + the family floats in the /admin/benefits queue via
 * metadata.benefits_cascade.outcome.
 *
 * POST /api/families/benefits-outcome
 *   { tok: string }                 → record the outcome carried by the token
 *   { tok: string, reason: string } → attach the wrong_program "what didn't
 *                                     fit" one-tap reason (second POST)
 *
 * Last-write-wins so a family can change their answer; the Slack ping fires
 * only on a TRANSITION to wants_help so re-taps don't re-page.
 */

const VALID_REASONS = ["already_enrolled", "did_not_qualify", "too_complicated", "other"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tok: string | undefined = body.tok;
    const reason: string | undefined = body.reason;

    if (!tok) {
      return NextResponse.json({ error: "tok is required" }, { status: 400 });
    }
    const validation = validateBenefitsOutcomeToken(tok);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { familyProfileId, value } = validation;

    const db = getServiceClient();
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, display_name, email, state, metadata")
      .eq("id", familyProfileId)
      .eq("type", "family")
      .maybeSingle();

    if (!profile) {
      // Unknown id (deleted profile). No-op success so the page renders help
      // anyway — the family should never see an error for our data hygiene.
      return NextResponse.json({ success: true, value, noop: "not_found" });
    }

    const meta = (profile.metadata as Record<string, unknown>) || {};
    const cascade = readBenefitsCascade(meta);
    const now = new Date().toISOString();

    const programName = cascade.first_step_program_name || null;
    const programUrl =
      cascade.first_step_state_id && cascade.first_step_program_id
        ? `/benefits/${cascade.first_step_state_id}/${cascade.first_step_program_id}`
        : "/benefits/finder";

    // Reason-only follow-up from the wrong_program landing path.
    if (reason) {
      if (!(VALID_REASONS as readonly string[]).includes(reason)) {
        return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
      }
      meta.benefits_cascade = { ...cascade, outcome_reason: reason } satisfies BenefitsCascadeMeta;
      const { error: updErr } = await db
        .from("business_profiles")
        .update({ metadata: meta })
        .eq("id", profile.id);
      if (updErr) console.error("[benefits-outcome] reason update failed:", updErr);
      return NextResponse.json({ success: true, value, reasonRecorded: true });
    }

    const previousOutcome = cascade.outcome;
    meta.benefits_cascade = { ...cascade, outcome: value, outcome_at: now } satisfies BenefitsCascadeMeta;
    const { error: updErr } = await db
      .from("business_profiles")
      .update({ metadata: meta })
      .eq("id", profile.id);
    if (updErr) {
      console.error("[benefits-outcome] update failed:", updErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Activity event — the outcome record proper (constraint: migration 148).
    // Insert only when the answer changed so a re-opened email doesn't stack
    // duplicate events.
    if (previousOutcome !== value) {
      const { error: evErr } = await db.from("seeker_activity").insert({
        profile_id: profile.id,
        event_type: "benefits_outcome_reported",
        metadata: { value, program_id: cascade.first_step_program_id || null },
      });
      if (evErr) console.error("[benefits-outcome] event insert failed:", evErr);
    }

    // Cascade trigger: page the queue owner, once per transition into wants_help.
    if (value === "wants_help" && previousOutcome !== "wants_help") {
      const alert = slackBenefitsWantsHelp({
        familyName: profile.display_name || "Unnamed family",
        email: profile.email || null,
        stateCode: profile.state || null,
        programName,
        profileId: profile.id,
      });
      const [slackResult] = await Promise.allSettled([sendSlackAlert(alert.text, alert.blocks)]);
      if (slackResult.status === "rejected") {
        console.error("[benefits-outcome] Slack alert failed:", slackResult.reason);
      }
    }

    // Their full match list for the landing page (the /m/{token} page), when
    // one was issued at intake.
    let matchesUrl = "/benefits/finder";
    const { data: resultsToken } = await db
      .from("benefits_results_tokens")
      .select("token")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (resultsToken?.token) matchesUrl = `/m/${resultsToken.token}`;

    return NextResponse.json({
      success: true,
      value,
      firstName: profile.display_name?.split(/\s+/)[0] || null,
      state: profile.state || null,
      programName,
      programUrl,
      matchesUrl,
    });
  } catch (err) {
    console.error("[benefits-outcome] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
