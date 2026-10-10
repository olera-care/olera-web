import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { readBenefitsCascade, type BenefitsCascadeMeta } from "@/lib/family-comms/benefits-cascade.server";
import { applicationFor, applicationsOf, isApplyRoute, withApplication, withDecision } from "@/lib/benefits/applications";

/**
 * Journey writes for the /m/{token} living page (plans/benefits-living-journey.md).
 *
 * Auth: the results token itself — same grant that shows the matches lets the
 * family record their own progress. Metadata-only writes into
 * business_profiles.metadata.benefits_cascade (no new seeker_activity event
 * types — the CHECK-constraint lesson); the admin queue and coordinator read
 * the same object.
 *
 * POST /api/families/benefits-journey
 *   { token, action: "call_made", programId? }
 *   { token, action: "doc_toggle", doc, checked }
 *   { token, action: "applied", route?, programId?, stateId? } — sent an
 *     application through an apply-along. route "ssa_extra_help" (default):
 *     Social Security's Extra Help form, which also starts Medicare Savings
 *     (lib/benefits/apply-along.ts); "state_snap": the state's SNAP form
 *     (lib/benefits/apply-along-snap.ts)
 *   { token, action: "decision", value: "approved"|"waiting"|"denied"|"stuck", route? }
 *     — what came back, tapped on the plan's card for that application
 *
 * `call_made` deliberately does NOT set cascade.outcome — that field stays the
 * family's check-in self-report; first_step_done_at is the page-observed act.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token: string = body.token || "";
    const action: string = body.action || "";

    if (!/^[A-Za-z0-9_-]{16}$/.test(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (!["call_made", "doc_toggle", "applied", "decision"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: tokenRow } = await db
      .from("benefits_results_tokens")
      .select("profile_id")
      .eq("token", token)
      .maybeSingle();
    if (!tokenRow?.profile_id) {
      return NextResponse.json({ error: "Unknown token" }, { status: 404 });
    }

    const { data: profile } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("id", tokenRow.profile_id)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Unknown profile" }, { status: 404 });

    const meta = (profile.metadata as Record<string, unknown>) || {};
    const cascade = readBenefitsCascade(meta);
    const now = new Date().toISOString();
    let next: BenefitsCascadeMeta = cascade;

    if (action === "call_made") {
      next = {
        ...cascade,
        first_step_done_at: cascade.first_step_done_at || now,
        first_step_done_program_id:
          cascade.first_step_done_program_id ||
          (typeof body.programId === "string" ? body.programId : cascade.first_step_program_id),
        application_status: "called",
        application_status_at: now,
      };
    } else if (action === "applied") {
      const route = isApplyRoute(body.route) ? body.route : "ssa_extra_help";
      const programId = typeof body.programId === "string" ? body.programId.slice(0, 120) : route === "ssa_extra_help" ? cascade.first_step_program_id : undefined;
      const stateId = typeof body.stateId === "string" ? body.stateId.slice(0, 40) : cascade.first_step_state_id;
      // Medicare Savings is a plan's first step; SNAP rarely is, so only the
      // first marks the first step done.
      const firstStep = route === "ssa_extra_help"
        ? { first_step_done_at: cascade.first_step_done_at || now, first_step_done_program_id: cascade.first_step_done_program_id || programId }
        : {};
      next = {
        ...cascade,
        ...firstStep,
        application_status: "applied",
        application_status_at: now,
      };
      // The first submission is the one the check-ins count from.
      if (!applicationFor(cascade, route)) {
        next = withApplication(next, { at: now, route, program_id: programId, state_id: stateId });
      }
        } else if (action === "decision") {
      const value = body.value;
      if (!["approved", "waiting", "denied", "stuck"].includes(value)) {
        return NextResponse.json({ error: "Invalid value" }, { status: 400 });
      }
      const route = isApplyRoute(body.route) ? body.route : null;
      if (route ? !applicationFor(cascade, route) : !applicationsOf(cascade).length) {
        return NextResponse.json({ error: "No application recorded" }, { status: 409 });
      }
      const status = value === "denied" ? "not_eligible" : value;
      next = {
        ...withDecision(cascade, value, now, route),
        application_status: status,
        application_status_at: now,
        // The same outcome a text reply would set, so the admin queue and the
        // cascade read it the same way.
        // A denial is where a person helps most (appeal, or the next program),
        // and the card promises one, so it asks for help like STUCK does: the
        // hourly help-case sweep opens an owned case for "wants_help".
        ...(value === "stuck" || value === "denied"
          ? { outcome: "wants_help" as const, outcome_at: now, ...(value === "denied" ? { outcome_reason: "not_eligible" } : {}) }
          : { outcome: "moving" as const, outcome_at: now }),
      };
    } else {
      const doc = typeof body.doc === "string" ? body.doc.slice(0, 200) : "";
      if (!doc) return NextResponse.json({ error: "doc required" }, { status: 400 });
      const set = new Set(cascade.docs_checked || []);
      if (body.checked) set.add(doc);
      else set.delete(doc);
      next = { ...cascade, docs_checked: [...set].slice(0, 30) };
    }

    const { error: updErr } = await db
      .from("business_profiles")
      .update({ metadata: { ...meta, benefits_cascade: next } })
      .eq("id", profile.id);
    if (updErr) {
      console.error("[benefits-journey] update failed:", updErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      firstStepDoneAt: next.first_step_done_at || null,
      docsChecked: next.docs_checked || [],
      applied: next.applied || null,
      applications: applicationsOf(next),
    });
  } catch (err) {
    console.error("[benefits-journey] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
