import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/medjobs/completed-work
 *
 * v9.0 Phase 7 Commit O: unified Logs feed. Merges three completion
 * sources into one chronological stream:
 *
 *   1. student_outreach_touchpoints — stakeholder-side action history.
 *   2. business_profile_tasks (status=completed) — Client/Candidate
 *      Step Board completions.
 *   3. site_tasks (status=completed) — Site Step Board completions.
 *
 * Each source is hydrated with its parent entity's display name and
 * mapped to a uniform CompletedTaskRow shape so a single feed renders
 * the whole operating system's history. Source kind is preserved on
 * each row so the Logs page can route drawer clicks to the right
 * entity drawer (stakeholder / provider / candidate / site).
 *
 * Excluded touchpoint types (background events, not completed actions):
 *   - task_cancelled, task_superseded, step_skipped, snoozed
 *   - system_seasonal_due
 *   - contact_added, contact_replaced, contact_marked_stale
 *   - email_bounced, approval_expired
 *
 * Query params:
 *   from=<iso>          → start of date window (default: 90 days ago)
 *   to=<iso>            → end of date window (default: now)
 *   limit=<n>           → max rows (default 50, max 200)
 */

const COMPLETED_ACTION_TYPES = [
  "email_sent",
  "email_replied",
  "ig_dm_sent",
  "ig_dm_replied",
  "contact_form_submitted",
  "call_no_answer",
  "call_voicemail",
  "call_connected",
  "call_wrong_number",
  "meeting_scheduled",
  "meeting_held",
  "meeting_no_show",
  "meeting_rescheduled",
  "approval_granted",
  "distribution_confirmed",
  "stage_change",
  "note_added",
] as const;

interface UnifiedRow {
  id: string;
  outreach_id: string;
  touchpoint_type: string;
  channel: string | null;
  outcome: string | null;
  notes: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  organization_name: string;
  kind: string;
  stakeholder_type: string | null;
  campus_name: string | null;
  source_kind: "stakeholder" | "client" | "candidate" | "site";
  source_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 90);
    const from = fromParam ? new Date(fromParam) : defaultFrom;
    const to = toParam ? new Date(toParam) : now;

    const db = getServiceClient();

    // ── Fetch all three sources in parallel ────────────────────────
    const [
      { data: touchpoints, error: tpErr },
      { data: bpTaskCompletions },
      { data: siteTaskCompletions },
    ] = await Promise.all([
      db
        .from("student_outreach_touchpoints")
        .select(
          "id, outreach_id, touchpoint_type, channel, outcome, notes, payload, created_at",
        )
        .in("touchpoint_type", COMPLETED_ACTION_TYPES as unknown as string[])
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit),
      db
        .from("business_profile_tasks")
        .select("id, business_profile_id, kind, payload, completed_at")
        .eq("status", "completed")
        .gte("completed_at", from.toISOString())
        .lte("completed_at", to.toISOString())
        .order("completed_at", { ascending: false })
        .limit(limit),
      db
        .from("site_tasks")
        .select("id, campus_id, payload, completed_at")
        .eq("status", "completed")
        .gte("completed_at", from.toISOString())
        .lte("completed_at", to.toISOString())
        .order("completed_at", { ascending: false })
        .limit(limit),
    ]);

    if (tpErr) {
      console.error("[completed-work] touchpoints error:", tpErr);
      return NextResponse.json({ error: tpErr.message }, { status: 500 });
    }

    // ── Hydrate stakeholder touchpoints ────────────────────────────
    const tpRows = (touchpoints ?? []) as Array<{
      id: string;
      outreach_id: string;
      touchpoint_type: string;
      channel: string | null;
      outcome: string | null;
      notes: string | null;
      payload: Record<string, unknown> | null;
      created_at: string;
    }>;

    const outreachIds = Array.from(new Set(tpRows.map((r) => r.outreach_id)));
    const { data: outreachRows } = outreachIds.length
      ? await db
          .from("student_outreach")
          .select("id, organization_name, campus_id, kind, stakeholder_type")
          .in("id", outreachIds)
      : { data: [] };

    type ORow = {
      id: string;
      organization_name: string;
      campus_id: string;
      kind: string;
      stakeholder_type: string | null;
    };
    const outreachMap = new Map<string, ORow>();
    for (const r of (outreachRows ?? []) as ORow[]) outreachMap.set(r.id, r);

    // Campus context for stakeholder touchpoints + entity sources.
    const campusIdsFromOutreach = ((outreachRows ?? []) as ORow[]).map((r) => r.campus_id);
    const campusIdsFromSiteTasks = (siteTaskCompletions ?? []).map(
      (t: { campus_id: string }) => t.campus_id,
    );
    const allCampusIds = Array.from(
      new Set([...campusIdsFromOutreach, ...campusIdsFromSiteTasks].filter(Boolean)),
    );
    const { data: campusRows } = allCampusIds.length
      ? await db
          .from("student_outreach_campuses")
          .select("id, name")
          .in("id", allCampusIds)
      : { data: [] };
    const campusMap = new Map<string, string>();
    for (const c of (campusRows ?? []) as Array<{ id: string; name: string }>) {
      campusMap.set(c.id, c.name);
    }

    // ── Hydrate entity-task completions ────────────────────────────
    const bpTaskRows = (bpTaskCompletions ?? []) as Array<{
      id: string;
      business_profile_id: string;
      kind: "client" | "candidate";
      payload: Record<string, unknown> | null;
      completed_at: string;
    }>;
    const profileIds = Array.from(new Set(bpTaskRows.map((t) => t.business_profile_id)));
    const { data: profileRows } = profileIds.length
      ? await db
          .from("business_profiles")
          .select("id, display_name")
          .in("id", profileIds)
      : { data: [] };
    const profileNameMap = new Map<string, string>();
    for (const p of (profileRows ?? []) as Array<{ id: string; display_name: string | null }>) {
      profileNameMap.set(p.id, p.display_name ?? "(unnamed)");
    }

    // ── Merge into one unified feed ────────────────────────────────
    const unified: UnifiedRow[] = [];

    for (const t of tpRows) {
      const o = outreachMap.get(t.outreach_id);
      unified.push({
        id: t.id,
        outreach_id: t.outreach_id,
        touchpoint_type: t.touchpoint_type,
        channel: t.channel,
        outcome: t.outcome,
        notes: t.notes,
        payload: t.payload,
        created_at: t.created_at,
        organization_name: o?.organization_name ?? "(unknown)",
        kind: o?.kind ?? "student_org",
        stakeholder_type: o?.stakeholder_type ?? null,
        campus_name: o ? campusMap.get(o.campus_id) ?? null : null,
        source_kind: "stakeholder",
        source_id: t.outreach_id,
      });
    }

    for (const t of bpTaskRows) {
      const summary =
        (t.payload?.summary as string | undefined) ??
        (t.payload?.notes as string | undefined) ??
        null;
      unified.push({
        id: t.id,
        outreach_id: "",
        touchpoint_type:
          t.kind === "client" ? "task_completed_client" : "task_completed_candidate",
        channel: null,
        outcome: null,
        notes: summary,
        payload: t.payload,
        created_at: t.completed_at,
        organization_name: profileNameMap.get(t.business_profile_id) ?? "(unknown)",
        kind: t.kind,
        stakeholder_type: null,
        campus_name: null,
        source_kind: t.kind,
        source_id: t.business_profile_id,
      });
    }

    for (const t of (siteTaskCompletions ?? []) as Array<{
      id: string;
      campus_id: string;
      payload: Record<string, unknown> | null;
      completed_at: string;
    }>) {
      const summary =
        (t.payload?.summary as string | undefined) ??
        (t.payload?.notes as string | undefined) ??
        null;
      const siteName = campusMap.get(t.campus_id) ?? "(unknown)";
      unified.push({
        id: t.id,
        outreach_id: "",
        touchpoint_type: "task_completed_site",
        channel: null,
        outcome: null,
        notes: summary,
        payload: t.payload,
        created_at: t.completed_at,
        organization_name: siteName,
        kind: "site",
        stakeholder_type: null,
        campus_name: siteName,
        source_kind: "site",
        source_id: t.campus_id,
      });
    }

    // Sort merged feed by timestamp desc, cap at limit.
    unified.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const trimmed = unified.slice(0, limit);

    return NextResponse.json({ rows: trimmed, total: trimmed.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[completed-work] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
