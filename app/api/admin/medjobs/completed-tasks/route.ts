import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/medjobs/completed-tasks
 *
 * Touchpoint feed of completed operational actions, ordered most
 * recent first. Filters to action-bearing touchpoint types (admin
 * actually did something) and joins each row with its source
 * student_outreach + campus context for rendering.
 *
 * Excluded touchpoint types (background events / mechanics, not
 * completed actions):
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

    const { data: touchpoints, error } = await db
      .from("student_outreach_touchpoints")
      .select(
        "id, outreach_id, touchpoint_type, channel, outcome, notes, payload, created_at, created_by",
      )
      .in("touchpoint_type", COMPLETED_ACTION_TYPES as unknown as string[])
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[completed-tasks] query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (touchpoints ?? []) as Array<{
      id: string;
      outreach_id: string;
      touchpoint_type: string;
      channel: string | null;
      outcome: string | null;
      notes: string | null;
      payload: Record<string, unknown> | null;
      created_at: string;
      created_by: string | null;
    }>;

    if (rows.length === 0) {
      return NextResponse.json({ rows: [], total: 0 });
    }

    // Hydrate org / contact / campus context in one pass.
    const outreachIds = Array.from(new Set(rows.map((r) => r.outreach_id)));
    const { data: outreachRows } = await db
      .from("student_outreach")
      .select("id, organization_name, campus_id, kind, stakeholder_type")
      .in("id", outreachIds);

    type ORow = {
      id: string;
      organization_name: string;
      campus_id: string;
      kind: string;
      stakeholder_type: string | null;
    };
    const outreachMap = new Map<string, ORow>();
    for (const r of (outreachRows ?? []) as ORow[]) outreachMap.set(r.id, r);

    const campusIds = Array.from(
      new Set(((outreachRows ?? []) as ORow[]).map((r) => r.campus_id)),
    );
    const { data: campusRows } = await db
      .from("student_outreach_campuses")
      .select("id, name")
      .in("id", campusIds);
    const campusMap = new Map<string, string>();
    for (const c of (campusRows ?? []) as Array<{ id: string; name: string }>) {
      campusMap.set(c.id, c.name);
    }

    const enriched = rows.map((t) => {
      const o = outreachMap.get(t.outreach_id);
      return {
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
      };
    });

    return NextResponse.json({ rows: enriched, total: enriched.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[completed-tasks] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
