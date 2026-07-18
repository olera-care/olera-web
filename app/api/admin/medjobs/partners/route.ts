import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { resolveOutreachSearchIds } from "@/lib/student-outreach/search";

/**
 * GET /api/admin/medjobs/partners
 *
 * Active partners: campus stakeholders distributing students. Excludes
 * kind='provider' rows — those represent providers acting as partners
 * historically; per v9.0 product model, providers always live in the
 * Clients surface (whether or not they're paying), never in Partners.
 *
 * Query params:
 *   campus=<slug>           → filter to one campus
 *   search=<str>            → matches org name, on-row research emails, or
 *                             any active contact's name/email (shared resolver)
 *   limit=<n>               → max rows (default 100, max 500)
 *   with_pending_task=true  → narrow to active partners with ≥1
 *                             pending student_outreach_task. Used by
 *                             the dedicated Partners page so its
 *                             scope matches the In Basket Partners
 *                             tab + sidebar Partners fraction. Quiet
 *                             active partners (no pending task) live
 *                             in Logs.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const campusSlug = searchParams.get("campus")?.trim() || null;
    const search = searchParams.get("search")?.trim() ?? "";
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
    const withPendingTask = searchParams.get("with_pending_task") === "true";

    const db = getServiceClient();

    // v10 liberalized search: resolve matching outreach IDs across org name,
    // on-row research emails, and named-contact name/email (shared resolver),
    // then intersect via .in("id", …) below. `[]` = searched, matched nothing.
    const searchIds = search ? await resolveOutreachSearchIds(db, search) : null;
    if (searchIds && searchIds.length === 0) {
      return NextResponse.json({ rows: [], total: 0 });
    }

    // v9.0 Phase 7 Commit P: when with_pending_task=true, narrow the
    // result set to active_partner outreach with ≥1 pending task.
    let partnersWithPendingTask: Set<string> | null = null;
    if (withPendingTask) {
      const { data: tasks } = await db
        .from("student_outreach_tasks")
        .select("outreach_id")
        .eq("status", "pending");
      partnersWithPendingTask = new Set(
        ((tasks ?? []) as Array<{ outreach_id: string }>).map((t) => t.outreach_id),
      );
      if (partnersWithPendingTask.size === 0) {
        return NextResponse.json({ rows: [], total: 0 });
      }
    }

    let q = db
      .from("student_outreach")
      .select(
        "id, campus_id, kind, stakeholder_type, organization_name, department, status, viewed_at, last_edited_at, created_at, distribution_evidence, distribution_evidence_notes",
      )
      .eq("status", "active_partner")
      .neq("kind", "provider")
      .order("last_edited_at", { ascending: false })
      .limit(limit);

    if (partnersWithPendingTask) {
      q = q.in("id", Array.from(partnersWithPendingTask));
    }
    // Two `.in("id", …)` filters AND together (intersection) at PostgREST, so
    // a task-narrowed + searched query returns rows satisfying both.
    if (searchIds) q = q.in("id", searchIds);

    if (campusSlug) {
      const { data: campus } = await db
        .from("student_outreach_campuses")
        .select("id")
        .eq("slug", campusSlug)
        .maybeSingle();
      if (campus?.id) q = q.eq("campus_id", campus.id);
    }

    const { data: rows, error } = await q;
    if (error) {
      console.error("[partners] query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    type Row = {
      id: string;
      campus_id: string;
      kind: string;
      stakeholder_type: string | null;
      organization_name: string;
      department: string | null;
      status: string;
      viewed_at: string | null;
      last_edited_at: string;
      created_at: string;
      distribution_evidence: string | null;
      distribution_evidence_notes: string | null;
    };
    const list = (rows ?? []) as Row[];

    if (list.length === 0) return NextResponse.json({ rows: [], total: 0 });

    // Hydrate campus names + active contact in one batch.
    const campusIds = Array.from(new Set(list.map((r) => r.campus_id)));
    const outreachIds = list.map((r) => r.id);
    const [{ data: campuses }, { data: contacts }] = await Promise.all([
      db.from("student_outreach_campuses").select("id, name").in("id", campusIds),
      db
        .from("student_outreach_contacts")
        .select("outreach_id, name, first_name, last_name, title, role, email")
        .in("outreach_id", outreachIds)
        .eq("status", "active"),
    ]);
    const campusName = new Map<string, string>();
    for (const c of (campuses ?? []) as Array<{ id: string; name: string }>) {
      campusName.set(c.id, c.name);
    }
    type C = { outreach_id: string; name: string | null; first_name: string | null; last_name: string | null; title: string | null; role: string | null; email: string | null };
    const contactByOutreach = new Map<string, C>();
    for (const c of (contacts ?? []) as C[]) {
      if (!contactByOutreach.has(c.outreach_id)) contactByOutreach.set(c.outreach_id, c);
    }

    const enriched = list.map((r) => {
      const c = contactByOutreach.get(r.id) ?? null;
      const display =
        c &&
        ([c.title, c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.name);
      return {
        id: r.id,
        organization_name: r.organization_name,
        department: r.department,
        kind: r.kind,
        stakeholder_type: r.stakeholder_type,
        campus_name: campusName.get(r.campus_id) ?? null,
        viewed_at: r.viewed_at,
        last_edited_at: r.last_edited_at,
        distribution_evidence: r.distribution_evidence,
        distribution_evidence_notes: r.distribution_evidence_notes,
        primary_contact_name: display ?? null,
        primary_contact_role: c?.role ?? null,
        primary_contact_email: c?.email ?? null,
      };
    });

    // v9.0 Phase 7 Commit K: rows stay in last_edited_at order
    // (most-recently-queued first). Unread is visual-only.
    return NextResponse.json({ rows: enriched, total: enriched.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[partners] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
