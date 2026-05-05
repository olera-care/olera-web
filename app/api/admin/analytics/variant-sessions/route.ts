import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

// One row in the drill-in table — the journey of a single session through
// the Family Intake funnel for one A/B arm. The shape is intentionally the
// same for benefits arms and the outreach arm so the admin UI can render
// one component for both. `submitter` is populated only when the session
// reached the Submitted stage:
//   benefits arms → accounts.display_name (the firstName captured at submit)
//   outreach arm  → agent_outreach_requests.seeker_email
// Two different fields because the two surfaces collect different first-
// signal: the benefits form asks for first name + email, while the
// outreach module asks for email only. Showing whichever is available.
export type VariantSessionRow = {
  session_id: string;
  furthest_stage: "impression" | "started" | "care_need" | "submitted";
  provider_id: string | null;
  first_seen: string;            // ISO timestamp of the earliest event in window
  care_need_selected: string | null;
  submitter: string | null;
};

export type VariantSessionsResponse = {
  variant: string;
  total: number;
  sessions: VariantSessionRow[];
};

const VALID_VARIANTS = new Set([
  "availability",
  "loss",
  "empathic",
  "outreach",
  "inline_answer",
  "control",
  "money_loss",
]);

const STAGE_RANK: Record<VariantSessionRow["furthest_stage"], number> = {
  impression: 0,
  started: 1,
  care_need: 2,
  submitted: 3,
};

// step_name → stage. Mirrors the mapping in /api/admin/analytics/summary so
// the drill-in's stage labels match the funnel's column counts exactly.
const STEP_TO_STAGE: Record<string, VariantSessionRow["furthest_stage"] | undefined> = {
  "care-need": "care_need",
  save: "submitted",
  contact: "submitted",
};

function parseLimit(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : 50;
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(200, n));
}

function parseOffset(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : 0;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * GET /api/admin/analytics/variant-sessions
 *
 * Drill-in for one A/B arm in the Family Intake funnel. Returns up to
 * `limit` sessions (most recent first) bucketed into the variant, with
 * the furthest funnel stage each session reached and — when available —
 * the email collected at submission.
 *
 * Query params:
 *   variant   one of availability | loss | empathic | outreach | control | money_loss
 *   date_from ISO timestamp (inclusive). Omit for all-time.
 *   date_to   ISO timestamp (exclusive). Omit for "up to now."
 *   limit     1-200, default 50
 *   offset    >= 0, default 0 (pagination cursor)
 *
 * Returns: { variant, total, sessions: VariantSessionRow[] }
 *
 * Out-of-scope: live session traces (fetch /admin/activity for that),
 * cross-arm sessions (a session always hashes into exactly one arm).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const sp = request.nextUrl.searchParams;
    const variant = sp.get("variant") || "";
    if (!VALID_VARIANTS.has(variant)) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }
    const from = sp.get("date_from");
    const to = sp.get("date_to");
    const limit = parseLimit(sp.get("limit"));
    const offset = parseOffset(sp.get("offset"));

    const db = getServiceClient();

    // Per-session aggregator. Each session_id collapses across all its
    // events into one row carrying the furthest stage reached + earliest
    // timestamp + the (optional) care-need it selected at the started step.
    const sessions = new Map<string, VariantSessionRow>();

    const upgrade = (sid: string, stage: VariantSessionRow["furthest_stage"], created_at: string, providerId: string | null, careNeed: string | null) => {
      const existing = sessions.get(sid);
      if (!existing) {
        sessions.set(sid, {
          session_id: sid,
          furthest_stage: stage,
          provider_id: providerId,
          first_seen: created_at,
          care_need_selected: careNeed,
          submitter: null,
        });
        return;
      }
      if (STAGE_RANK[stage] > STAGE_RANK[existing.furthest_stage]) {
        existing.furthest_stage = stage;
      }
      if (created_at < existing.first_seen) existing.first_seen = created_at;
      // Backfill provider_id / care_need from whichever event carries it.
      if (!existing.provider_id && providerId) existing.provider_id = providerId;
      if (!existing.care_need_selected && careNeed) existing.care_need_selected = careNeed;
    };

    if (variant === "outreach") {
      // Outreach arm — events live in seeker_activity, no metadata.variant
      // (the event_type IS the variant). Bucket all three event types.
      let q = db
        .from("seeker_activity")
        .select("event_type, metadata, created_at")
        .in("event_type", [
          "outreach_module_impression",
          "outreach_card_clicked",
          "outreach_request_submitted",
        ])
        .order("created_at", { ascending: false })
        .limit(20000);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lt("created_at", to);

      const res = await q;
      if (res.error) {
        console.error("[variant-sessions] outreach query failed:", res.error);
        return NextResponse.json({ error: "Query failed" }, { status: 500 });
      }
      for (const row of (res.data ?? []) as Array<{
        event_type: string;
        metadata: Record<string, unknown> | null;
        created_at: string;
      }>) {
        const sid = row.metadata?.session_id;
        if (typeof sid !== "string" || !sid) continue;
        const stage: VariantSessionRow["furthest_stage"] | null =
          row.event_type === "outreach_module_impression" ? "impression"
          : row.event_type === "outreach_card_clicked" ? "started"
          : row.event_type === "outreach_request_submitted" ? "submitted"
          : null;
        if (!stage) continue;
        const providerId =
          typeof row.metadata?.source_provider_id === "string"
            ? (row.metadata.source_provider_id as string)
            : null;
        upgrade(sid, stage, row.created_at, providerId, null);
      }

      // Outreach submitter join — agent_outreach_requests carries
      // seeker_email and (post-migration #067) session_id. Pre-migration
      // rows have NULL session_id and won't link.
      const submittedSids = [...sessions.values()]
        .filter((s) => s.furthest_stage === "submitted")
        .map((s) => s.session_id);
      if (submittedSids.length > 0) {
        const emailRes = await db
          .from("agent_outreach_requests")
          .select("session_id, seeker_email")
          .in("session_id", submittedSids)
          .limit(submittedSids.length);
        if (!emailRes.error) {
          for (const row of (emailRes.data ?? []) as Array<{
            session_id: string | null;
            seeker_email: string | null;
          }>) {
            if (!row.session_id || !row.seeker_email) continue;
            const session = sessions.get(row.session_id);
            if (session) session.submitter = row.seeker_email;
          }
        }
      }
    } else if (variant === "inline_answer") {
      // Inline answer arm — events live in provider_activity but use unique
      // event types (inline_answer_viewed, inline_answer_expanded, inline_answer_converted).
      // Similar structure to outreach but different table.
      let q = db
        .from("provider_activity")
        .select("event_type, metadata, created_at, provider_id")
        .in("event_type", [
          "inline_answer_viewed",
          "inline_answer_expanded",
          "inline_answer_converted",
        ])
        .order("created_at", { ascending: false })
        .limit(20000);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lt("created_at", to);

      const res = await q;
      if (res.error) {
        console.error("[variant-sessions] inline_answer query failed:", res.error);
        return NextResponse.json({ error: "Query failed" }, { status: 500 });
      }
      for (const row of (res.data ?? []) as Array<{
        event_type: string;
        metadata: Record<string, unknown> | null;
        created_at: string;
        provider_id: string | null;
      }>) {
        const sid = row.metadata?.session_id;
        if (typeof sid !== "string" || !sid) continue;
        const stage: VariantSessionRow["furthest_stage"] | null =
          row.event_type === "inline_answer_viewed" ? "impression"
          : row.event_type === "inline_answer_expanded" ? "started"
          : row.event_type === "inline_answer_converted" ? "submitted"
          : null;
        if (!stage) continue;
        const providerId = row.provider_id ?? null;
        upgrade(sid, stage, row.created_at, providerId, null);
      }

      // Inline answer submitter join — the email is captured via the inline
      // answer flow. For now, we don't have a separate table for it, but
      // the event metadata may contain the email.
      const submittedSids = [...sessions.values()]
        .filter((s) => s.furthest_stage === "submitted")
        .map((s) => s.session_id);
      if (submittedSids.length > 0) {
        // Try to get emails from the conversion events themselves
        const emailQ = db
          .from("provider_activity")
          .select("metadata")
          .eq("event_type", "inline_answer_converted")
          .in("session_id", submittedSids)
          .limit(submittedSids.length);
        const emailRes = await emailQ;
        if (!emailRes.error) {
          for (const row of (emailRes.data ?? []) as Array<{
            metadata: Record<string, unknown> | null;
          }>) {
            const sid = row.metadata?.session_id;
            const email = row.metadata?.email;
            if (typeof sid !== "string" || !sid || typeof email !== "string") continue;
            const session = sessions.get(sid);
            if (session) session.submitter = email;
          }
        }
      }
    } else {
      // Benefits arms (availability / loss / empathic) and legacy V2 arms
      // (control / money_loss). All live on provider_activity with
      // metadata.variant set on every event. provider_id is a top-level
      // column on provider_activity (set by /api/benefits/track-step), not
      // stored in metadata — read both so the drill-in shows the page even
      // when an older row left metadata.provider_id unset.
      let q = db
        .from("provider_activity")
        .select("event_type, metadata, created_at, provider_id")
        .in("event_type", [
          "benefits_entry_viewed",
          "benefits_started",
          "benefits_step_completed",
        ])
        .order("created_at", { ascending: false })
        .limit(20000);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lt("created_at", to);

      const res = await q;
      if (res.error) {
        console.error("[variant-sessions] benefits query failed:", res.error);
        return NextResponse.json({ error: "Query failed" }, { status: 500 });
      }
      for (const row of (res.data ?? []) as Array<{
        event_type: string;
        metadata: Record<string, unknown> | null;
        created_at: string;
        provider_id: string | null;
      }>) {
        const sid = row.metadata?.session_id;
        if (typeof sid !== "string" || !sid) continue;
        // Filter to this variant's events only.
        if (row.metadata?.variant !== variant) continue;

        let stage: VariantSessionRow["furthest_stage"] | undefined;
        if (row.event_type === "benefits_entry_viewed") stage = "impression";
        else if (row.event_type === "benefits_started") stage = "started";
        else if (row.event_type === "benefits_step_completed") {
          const stepName = row.metadata?.step_name;
          if (typeof stepName === "string") stage = STEP_TO_STAGE[stepName];
        }
        if (!stage) continue;

        const providerId = row.provider_id ?? null;
        const careNeed =
          typeof row.metadata?.care_need_selected === "string"
            ? (row.metadata.care_need_selected as string)
            : typeof row.metadata?.careNeedSelected === "string"
              ? (row.metadata.careNeedSelected as string)
              : null;
        upgrade(sid, stage, row.created_at, providerId, careNeed);
      }

      // Submitter name join — accounts.display_name (the firstName the
      // family entered at submit) keyed by accounts.session_id (post-
      // migration #067). Pre-migration rows have NULL session_id and
      // won't link; their drill-in row shows "—" for submitter.
      const submittedSids = [...sessions.values()]
        .filter((s) => s.furthest_stage === "submitted")
        .map((s) => s.session_id);
      if (submittedSids.length > 0) {
        const acctRes = await db
          .from("accounts")
          .select("session_id, display_name")
          .in("session_id", submittedSids)
          .limit(submittedSids.length);
        if (!acctRes.error) {
          for (const row of (acctRes.data ?? []) as Array<{
            session_id: string | null;
            display_name: string | null;
          }>) {
            if (!row.session_id || !row.display_name) continue;
            const session = sessions.get(row.session_id);
            if (session) session.submitter = row.display_name;
          }
        }
      }
    }

    // Sort newest-first by first_seen, then paginate.
    const all = [...sessions.values()].sort((a, b) =>
      a.first_seen < b.first_seen ? 1 : a.first_seen > b.first_seen ? -1 : 0,
    );
    const total = all.length;
    const slice = all.slice(offset, offset + limit);

    const response: VariantSessionsResponse = {
      variant,
      total,
      sessions: slice,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[admin/analytics/variant-sessions] uncaught:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
