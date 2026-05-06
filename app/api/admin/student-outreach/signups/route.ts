import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/student-outreach/signups
 *
 * Returns recent student business_profiles — the raw signup feed that
 * the PulseHeader KPI counts. Used by the Signups view in the ⋯ menu.
 *
 * Each row carries:
 *   - profile id, signed_up_at (created_at), email
 *   - full_name (best-effort: first + last, or `name`, or email local)
 *   - university (from metadata.university; null if not provided)
 *
 * Optional query params:
 *   - campus    campus slug; narrows by university name match
 *   - limit     default 100, max 500
 */

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const campusSlug = url.searchParams.get("campus");
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 100 : limitRaw), 500);

  const db = getServiceClient();

  // Resolve campus → university name match.
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

  const { data: profiles, error } = await db
    .from("business_profiles")
    .select("id, name, first_name, last_name, email, metadata, created_at")
    .eq("type", "student")
    .order("created_at", { ascending: false })
    .limit(limit * 4); // overfetch a bit since we filter by university in JS
  if (error) {
    console.error("signups fetch:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  const lowerName = campusName?.toLowerCase() ?? null;
  const rows = ((profiles ?? []) as Array<{
    id: string;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>)
    .filter((p) => {
      if (!lowerName) return true;
      const u =
        typeof p.metadata?.university === "string" ? (p.metadata.university as string) : null;
      return u !== null && u.toLowerCase() === lowerName;
    })
    .slice(0, limit)
    .map((p) => {
      const composed = [p.first_name, p.last_name]
        .map((s) => s?.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      const fullName = composed || p.name?.trim() || (p.email ? p.email.split("@")[0] : "(unknown)");
      const university =
        typeof p.metadata?.university === "string" ? (p.metadata.university as string) : null;
      return {
        id: p.id,
        full_name: fullName,
        university,
        email: p.email,
        signed_up_at: p.created_at,
      };
    });

  return NextResponse.json({ rows });
}
