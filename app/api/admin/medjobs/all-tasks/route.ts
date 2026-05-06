import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/medjobs/all-tasks
 *
 * Full operational audit log: every touchpoint across every state,
 * joined with its source student_outreach + campus context. Powers
 * the All Tasks left-menu page (search + audit + history). Same
 * shape as completed-tasks but without the action-type filter, so
 * background mechanics (task_superseded, snoozed, system_seasonal_due,
 * etc.) flow through too.
 *
 * Query params:
 *   from=<iso>    → start of date window (default: 90 days ago)
 *   to=<iso>      → end of date window (default: now)
 *   types=a,b,c   → comma-separated touchpoint_type filter
 *                   (powers the quick-filter chips on the page)
 *   search=<str>  → org-name ilike filter
 *   limit=<n>     → max rows (default 100, max 500)
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const typesParam = searchParams.get("types")?.trim();
    const search = searchParams.get("search")?.trim() ?? "";
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 90);
    const from = fromParam ? new Date(fromParam) : defaultFrom;
    const to = toParam ? new Date(toParam) : now;

    const types = typesParam ? typesParam.split(",").map((s) => s.trim()).filter(Boolean) : null;

    const db = getServiceClient();

    // Fetch the touchpoints first; if `search` is set we'll prune
    // after hydrating org names (PostgREST can't ilike-filter through
    // a join without an explicit FK alias here).
    let q = db
      .from("student_outreach_touchpoints")
      .select(
        "id, outreach_id, touchpoint_type, channel, outcome, notes, payload, created_at, created_by",
      )
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);
    if (types && types.length > 0) q = q.in("touchpoint_type", types);

    const { data: touchpoints, error } = await q;
    if (error) {
      console.error("[all-tasks] query error:", error);
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

    const outreachIds = Array.from(new Set(rows.map((r) => r.outreach_id)));
    const { data: outreachRows } = await db
      .from("student_outreach")
      .select("id, organization_name, campus_id, kind, stakeholder_type, status")
      .in("id", outreachIds);

    type ORow = {
      id: string;
      organization_name: string;
      campus_id: string;
      kind: string;
      stakeholder_type: string | null;
      status: string;
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

    const lowerSearch = search.toLowerCase();
    const enriched = rows
      .map((t) => {
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
          status: o?.status ?? null,
          campus_name: o ? campusMap.get(o.campus_id) ?? null : null,
        };
      })
      .filter((r) => {
        if (!lowerSearch) return true;
        return r.organization_name.toLowerCase().includes(lowerSearch);
      });

    return NextResponse.json({ rows: enriched, total: enriched.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[all-tasks] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
