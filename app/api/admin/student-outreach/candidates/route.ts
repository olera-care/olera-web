import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/student-outreach/candidates
 *
 * Returns LIVE candidate profiles — the subset of student signups that
 * are publicly visible to providers on the job board.
 *
 *   Candidates ⊂ Signups
 *
 * Live filter (matches /api/medjobs/candidates):
 *   - business_profiles.type = 'student'
 *   - business_profiles.is_active = true
 *   - metadata.application_completed = true
 *
 * Each row carries:
 *   - id, slug, display_name, signed_up_at (created_at)
 *   - city, state (location for the marketplace card)
 *   - university (from metadata.university)
 *   - program_track (from metadata.program_track — pre-med, pre-pa, etc.)
 *   - profile_completeness (from metadata, 0-100)
 *   - has_video (truthy metadata.video_intro_url)
 *   - certifications_count (length of metadata.certifications array)
 *
 * Optional query params:
 *   - campus              campus slug; narrows by university name match
 *   - state               two-letter state code
 *   - limit               default 100, max 500
 *   - with_pending_task   true → narrow to candidates with ≥1 pending
 *                         business_profile_task (kind='candidate'). Used
 *                         by the In Basket Candidates tab so the rendered
 *                         list matches the task-driven count.
 */

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const campusSlug = url.searchParams.get("campus");
  const stateFilter = url.searchParams.get("state");
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 100 : limitRaw), 500);
  const withPendingTask = url.searchParams.get("with_pending_task") === "true";

  const db = getServiceClient();

  // v9.0 Phase 7 Commit N: when with_pending_task=true, narrow to
  // business_profiles that have ≥1 pending business_profile_task of
  // kind='candidate'. Drives the In Basket Candidates tab.
  let candidatesWithPendingTask: Set<string> | null = null;
  if (withPendingTask) {
    const { data: tasks } = await db
      .from("business_profile_tasks")
      .select("business_profile_id")
      .eq("status", "pending")
      .eq("kind", "candidate");
    candidatesWithPendingTask = new Set(
      ((tasks ?? []) as Array<{ business_profile_id: string }>).map(
        (t) => t.business_profile_id,
      ),
    );
    if (candidatesWithPendingTask.size === 0) {
      return NextResponse.json({ rows: [] });
    }
  }

  let campusName: string | null = null;
  if (campusSlug) {
    const { data: campus } = await db
      .from("student_outreach_campuses")
      .select("name")
      .eq("slug", campusSlug)
      .single();
    if (!campus) return NextResponse.json({ rows: [] });
    campusName = (campus as { name: string }).name;
  }

  let q = db
    .from("business_profiles")
    .select("id, slug, display_name, city, state, metadata, created_at")
    .eq("type", "student")
    .eq("is_active", true)
    .contains("metadata", { application_completed: true })
    .order("created_at", { ascending: false })
    .limit(limit * 4); // overfetch since we filter by university in JS

  if (stateFilter) q = q.eq("state", stateFilter);

  const { data: profiles, error } = await q;
  if (error) {
    console.error("candidates fetch:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  const lowerCampus = campusName?.toLowerCase() ?? null;
  const rows = ((profiles ?? []) as Array<{
    id: string;
    slug: string | null;
    display_name: string | null;
    city: string | null;
    state: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>)
    .filter((p) => {
      if (candidatesWithPendingTask && !candidatesWithPendingTask.has(p.id)) return false;
      if (!lowerCampus) return true;
      const u =
        typeof p.metadata?.university === "string" ? (p.metadata.university as string) : null;
      return u !== null && u.toLowerCase() === lowerCampus;
    })
    .slice(0, limit)
    .map((p) => {
      const meta = (p.metadata ?? {}) as Record<string, unknown>;
      const certifications = Array.isArray(meta.certifications)
        ? (meta.certifications as unknown[])
        : [];
      return {
        id: p.id,
        slug: p.slug,
        display_name: p.display_name ?? "(unnamed)",
        city: p.city,
        state: p.state,
        university: typeof meta.university === "string" ? (meta.university as string) : null,
        program_track:
          typeof meta.program_track === "string" ? (meta.program_track as string) : null,
        profile_completeness:
          typeof meta.profile_completeness === "number"
            ? (meta.profile_completeness as number)
            : null,
        has_video: typeof meta.video_intro_url === "string" && meta.video_intro_url.length > 0,
        certifications_count: certifications.length,
        signed_up_at: p.created_at,
      };
    });

  return NextResponse.json({ rows });
}
