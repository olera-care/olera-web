import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

// One row in the drill-in table — the journey of a single session through
// the Family Intake funnel for one A/B arm. The shape is intentionally the
// same across all arms so the admin UI can render one component for both.
// `submitter` is populated only when the session reached the Submitted
// stage; we always surface the email (the operator's spot-check signal)
// regardless of arm:
//   benefits arms     → accounts.email
//   outreach arm      → agent_outreach_requests.seeker_email
//   qa_email_capture  → provider_questions.asker_email
//
// `submitter_link_id` is only populated for benefits arms, where the
// email belongs to a family business_profile that has a dedicated admin
// detail page at /admin/care-seekers/[id]. The frontend uses this to
// linkify the email for benefit submissions; outreach + qa_email_capture
// stay as plain text since they have no equivalent detail surface.
export type VariantSessionRow = {
  session_id: string;
  furthest_stage: "impression" | "started" | "care_need" | "submitted";
  provider_id: string | null;
  first_seen: string;            // ISO timestamp of the earliest event in window
  care_need_selected: string | null;
  submitter: string | null;
  submitter_link_id: string | null;
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
  "qa_email_capture",
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
          submitter_link_id: null,
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

    if (variant === "qa_email_capture") {
      // qa_email_capture arm — events live in seeker_activity. Impression
      // carries metadata.session_id; enrichment carries metadata.question_id
      // and (post-this-deploy) metadata.session_id. We bucket by session_id
      // when present, falling back to question_id as the row key for legacy
      // enrichments that predate session_id threading. Submitter email
      // comes from provider_questions.asker_email keyed on question_id.
      let q = db
        .from("seeker_activity")
        .select("event_type, metadata, related_provider_id, created_at")
        .in("event_type", ["qa_email_capture_impression", "question_email_enriched"])
        .order("created_at", { ascending: false })
        .limit(20000);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lt("created_at", to);

      const res = await q;
      if (res.error) {
        console.error("[variant-sessions] qa_email_capture query failed:", res.error);
        return NextResponse.json({ error: "Query failed" }, { status: 500 });
      }

      // question_id → row_key map. Post-deploy enrichments carry session_id
      // and we fold them into the impression's row (rowKey = session_id).
      // Pre-deploy enrichments lack session_id and become their own
      // question_id-keyed rows (rowKey = question_id). Either way we need
      // to remember which key we used so the submitter email join can find
      // the right row to populate.
      const rowKeyByQuestionId = new Map<string, string>();

      for (const row of (res.data ?? []) as Array<{
        event_type: string;
        metadata: Record<string, unknown> | null;
        related_provider_id: string | null;
        created_at: string;
      }>) {
        const sid = typeof row.metadata?.session_id === "string" ? row.metadata.session_id : null;
        const qid = typeof row.metadata?.question_id === "string" ? row.metadata.question_id : null;
        const providerId = row.related_provider_id ?? null;

        if (row.event_type === "qa_email_capture_impression") {
          if (!sid) continue; // impression without session_id is unusable
          upgrade(sid, "impression", row.created_at, providerId, null);
        } else if (row.event_type === "question_email_enriched") {
          if (!qid) continue; // can't resolve a row identity without it
          const rowKey = sid || qid;
          upgrade(rowKey, "submitted", row.created_at, providerId, null);
          rowKeyByQuestionId.set(qid, rowKey);
        }
      }

      // Submitter email join. provider_questions.asker_email is populated
      // by the PATCH enrichment endpoint at the same moment the
      // question_email_enriched event fires, so any enriched question
      // always has the email.
      if (rowKeyByQuestionId.size > 0) {
        const qids = [...rowKeyByQuestionId.keys()];
        const emailRes = await db
          .from("provider_questions")
          .select("id, asker_email")
          .in("id", qids)
          .limit(qids.length);
        if (!emailRes.error) {
          for (const row of (emailRes.data ?? []) as Array<{ id: string; asker_email: string | null }>) {
            if (!row.asker_email) continue;
            const rowKey = rowKeyByQuestionId.get(row.id);
            if (!rowKey) continue;
            const session = sessions.get(rowKey);
            if (session) session.submitter = row.asker_email;
          }
        }
      }
    } else if (variant === "outreach") {
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

      // Submitter join — operator wants to spot-check the lead's email,
      // and the email can deep-link to the family detail page at
      // /admin/care-seekers/[id]. Email lives on business_profiles
      // (NOT accounts — confirmed via migration 001), so this is two
      // steps: accounts → active_profile_id → business_profiles.email.
      // Keyed by accounts.session_id (post-migration #067). Pre-migration
      // rows have NULL session_id and won't link.
      const submittedSids = [...sessions.values()]
        .filter((s) => s.furthest_stage === "submitted")
        .map((s) => s.session_id);
      if (submittedSids.length > 0) {
        const acctRes = await db
          .from("accounts")
          .select("session_id, active_profile_id")
          .in("session_id", submittedSids)
          .limit(submittedSids.length);
        if (!acctRes.error) {
          // session_id → active_profile_id, also stash the link target
          // on the session row immediately so we get the deep link even
          // if the email lookup later fails.
          const profileIdsBySession = new Map<string, string>();
          for (const row of (acctRes.data ?? []) as Array<{
            session_id: string | null;
            active_profile_id: string | null;
          }>) {
            if (!row.session_id || !row.active_profile_id) continue;
            profileIdsBySession.set(row.session_id, row.active_profile_id);
            const session = sessions.get(row.session_id);
            if (session) session.submitter_link_id = row.active_profile_id;
          }

          // Now fetch emails from business_profiles for those profile ids.
          // Filter to type='family' as a defensive measure against data
          // corruption — a non-family profile shouldn't ever be pointed
          // to by an SBF submission's active_profile_id, but if it is,
          // we don't want to leak that row's email here.
          const profileIds = [...profileIdsBySession.values()];
          if (profileIds.length > 0) {
            const bpRes = await db
              .from("business_profiles")
              .select("id, email")
              .in("id", profileIds)
              .eq("type", "family")
              .limit(profileIds.length);
            if (!bpRes.error) {
              const emailByProfileId = new Map<string, string>();
              for (const row of (bpRes.data ?? []) as Array<{
                id: string;
                email: string | null;
              }>) {
                if (row.email) emailByProfileId.set(row.id, row.email);
              }
              for (const [sid, profileId] of profileIdsBySession.entries()) {
                const email = emailByProfileId.get(profileId);
                if (!email) continue;
                const session = sessions.get(sid);
                if (session) session.submitter = email;
              }
            }
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

/**
 * DELETE /api/admin/analytics/variant-sessions
 *
 * Hard-delete a single session's submission across the Family Intake
 * surface. Used for cleaning up admin test traffic that would otherwise
 * pollute conversion counts.
 *
 * Body: { session_id: string, variant: string }
 *
 * Cascade scope per arm (everything keyed off session_id):
 *   benefits arms (availability/loss/empathic + legacy V2 control/money_loss):
 *     accounts row (FK CASCADE → business_profiles → connections + saved_programs)
 *     seeker_activity events with metadata.session_id = session_id
 *     provider_activity events with metadata.session_id = session_id
 *
 *   outreach:
 *     agent_outreach_requests row by session_id
 *     seeker_activity events
 *
 *   qa_email_capture:
 *     provider_questions rows linked via question_email_enriched events
 *     seeker_activity events
 *
 * Lookups happen BEFORE deletes so question_id refs in seeker_activity
 * are still readable when we resolve which question to nuke.
 *
 * Each delete is audit-logged with the captured email + per-table counts.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    let body: { session_id?: unknown; variant?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const sessionId = typeof body.session_id === "string" ? body.session_id : "";
    const variant = typeof body.variant === "string" ? body.variant : "";
    if (!sessionId) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }
    if (!VALID_VARIANTS.has(variant)) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }

    const db = getServiceClient();
    const deleted: Record<string, number> = {};
    let auditEmail: string | null = null;

    // ── Phase 1: lookups (before any delete) ─────────────────────────────
    let accountId: string | null = null;
    let outreachRequestId: string | null = null;
    let questionIds: string[] = [];

    if (variant === "outreach") {
      const { data: row } = await db
        .from("agent_outreach_requests")
        .select("id, seeker_email")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (row) {
        outreachRequestId = row.id as string;
        auditEmail = (row.seeker_email as string | null) ?? null;
      }
    } else if (variant === "qa_email_capture") {
      // Find any provider_questions linked via question_email_enriched
      // events that carry both metadata.session_id and metadata.question_id.
      // Pre-deploy enrichments without session_id won't match here — those
      // rows are keyed by question_id in the drill-in's row identity, and
      // a future cleanup of legacy data would need a different code path.
      const { data: events } = await db
        .from("seeker_activity")
        .select("metadata")
        .eq("event_type", "question_email_enriched")
        .filter("metadata->>session_id", "eq", sessionId)
        .limit(50);
      const qidSet = new Set<string>();
      for (const ev of (events ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
        const qid = ev.metadata?.question_id;
        if (typeof qid === "string" && qid) qidSet.add(qid);
      }
      questionIds = [...qidSet];
      if (questionIds.length > 0) {
        const { data: q } = await db
          .from("provider_questions")
          .select("asker_email")
          .in("id", questionIds)
          .limit(questionIds.length);
        for (const row of (q ?? []) as Array<{ asker_email: string | null }>) {
          if (row.asker_email) { auditEmail = row.asker_email; break; }
        }
      }
    } else {
      // benefits arms (availability/loss/empathic/control/money_loss)
      const { data: acct } = await db
        .from("accounts")
        .select("id, active_profile_id")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (acct) {
        accountId = acct.id as string;
        if (acct.active_profile_id) {
          const { data: bp } = await db
            .from("business_profiles")
            .select("email")
            .eq("id", acct.active_profile_id)
            .eq("type", "family")
            .maybeSingle();
          if (bp) auditEmail = (bp.email as string | null) ?? null;
        }
      }
    }

    // ── Phase 2: cascading deletes ───────────────────────────────────────
    // Each delete checks `error` explicitly. Earlier version swallowed
    // errors and returned ok:true even when nothing was actually deleted
    // — leading to "row reappears after Load more" because the refetch
    // saw the still-present DB row.
    const errors: Array<{ table: string; message: string }> = [];

    if (accountId) {
      const { error, count } = await db
        .from("accounts")
        .delete({ count: "exact" })
        .eq("id", accountId);
      if (error) {
        console.error("[variant-sessions DELETE] accounts:", error);
        errors.push({ table: "accounts", message: error.message });
      } else {
        deleted.accounts = count ?? 0;
      }
    }
    if (outreachRequestId) {
      const { error, count } = await db
        .from("agent_outreach_requests")
        .delete({ count: "exact" })
        .eq("id", outreachRequestId);
      if (error) {
        console.error("[variant-sessions DELETE] agent_outreach_requests:", error);
        errors.push({ table: "agent_outreach_requests", message: error.message });
      } else {
        deleted.agent_outreach_requests = count ?? 0;
      }
    }
    if (questionIds.length > 0) {
      const { error, count } = await db
        .from("provider_questions")
        .delete({ count: "exact" })
        .in("id", questionIds);
      if (error) {
        console.error("[variant-sessions DELETE] provider_questions:", error);
        errors.push({ table: "provider_questions", message: error.message });
      } else {
        deleted.provider_questions = count ?? 0;
      }
    }

    {
      const { error, count } = await db
        .from("seeker_activity")
        .delete({ count: "exact" })
        .filter("metadata->>session_id", "eq", sessionId);
      if (error) {
        console.error("[variant-sessions DELETE] seeker_activity:", error);
        errors.push({ table: "seeker_activity", message: error.message });
      } else {
        deleted.seeker_activity = count ?? 0;
      }
    }
    {
      const { error, count } = await db
        .from("provider_activity")
        .delete({ count: "exact" })
        .filter("metadata->>session_id", "eq", sessionId);
      if (error) {
        console.error("[variant-sessions DELETE] provider_activity:", error);
        errors.push({ table: "provider_activity", message: error.message });
      } else {
        deleted.provider_activity = count ?? 0;
      }
    }

    // If any delete errored, surface it. Best-effort: we still ran every
    // delete (so the operator sees what got through in `deleted`), and
    // we still log the audit entry below — but the response status flips
    // so the frontend knows to keep the modal open and show the error.
    if (errors.length > 0) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "variant_submission_delete_failed",
        targetType: "variant_session",
        targetId: sessionId,
        details: { variant, email: auditEmail, deleted, errors },
      });
      return NextResponse.json(
        {
          error: `Delete failed in ${errors.length} table(s): ${errors.map((e) => e.table).join(", ")}`,
          deleted,
          errors,
        },
        { status: 500 },
      );
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "variant_submission_deleted",
      targetType: "variant_session",
      targetId: sessionId,
      details: {
        variant,
        email: auditEmail,
        deleted,
      },
    });

    return NextResponse.json({ ok: true, deleted, email: auditEmail });
  } catch (err) {
    console.error("[admin/analytics/variant-sessions] DELETE failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
