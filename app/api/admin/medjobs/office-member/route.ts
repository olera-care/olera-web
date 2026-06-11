/**
 * POST /api/admin/medjobs/office-member
 *
 * Attach people to a Site's advising OFFICE during research (Task: auto-attach).
 * Finds the campus's advising-office prospect (kind='advisor') and appends the
 * given people to research_data.office_members — or creates the office if none
 * exists yet. This is how contacts found via the audit's paste-a-page tool land
 * UNDER the office (as members) instead of becoming standalone prospect cards.
 *
 * Admin-only. Members live in research_data (not outreach contacts), so cold
 * outreach never fans out to them.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface IncomingMember {
  name?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  source_url?: string | null;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: { campus_slug?: string; office_name?: string; members?: IncomingMember[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const campusSlug = body.campus_slug?.trim();
  if (!campusSlug) return NextResponse.json({ error: "campus_slug required" }, { status: 400 });

  const incoming = (Array.isArray(body.members) ? body.members : [])
    .map((m) => ({
      name: m.name?.trim() || null,
      role: m.role?.trim() || null,
      email: m.email?.trim() || null,
      phone: m.phone?.trim() || null,
      source_url: m.source_url?.trim() || null,
    }))
    .filter((m) => m.name || m.email);
  if (incoming.length === 0) {
    return NextResponse.json({ error: "No usable members" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("id")
    .eq("slug", campusSlug)
    .maybeSingle();
  if (!campus) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  const campusId = (campus as { id: string }).id;

  // Find the Site's advising office (most recent advisor row).
  const { data: offices } = await db
    .from("student_outreach")
    .select("id, research_data")
    .eq("campus_id", campusId)
    .eq("kind", "advisor")
    .order("created_at", { ascending: false })
    .limit(1);
  let office = (offices ?? [])[0] as { id: string; research_data: Record<string, unknown> | null } | undefined;

  // Create the office if there isn't one yet.
  if (!office) {
    const { data: created, error } = await db
      .from("student_outreach")
      .insert({
        campus_id: campusId,
        kind: "advisor",
        stakeholder_type: "advisor",
        organization_name: body.office_name?.trim() || "Pre-Health Advising Office",
        status: "prospect",
        research_data: { office_members: [], source: "office_member_attach" },
        created_by: user.id,
      })
      .select("id, research_data")
      .single();
    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 400 });
    }
    office = created as { id: string; research_data: Record<string, unknown> | null };
  }

  // Merge members, deduping on email or name.
  const rd = (office.research_data ?? {}) as Record<string, unknown>;
  const existing = (Array.isArray(rd.office_members) ? rd.office_members : []) as IncomingMember[];
  const seen = new Set(
    existing.map((m) => (m.email?.toLowerCase() || m.name?.toLowerCase() || "")),
  );
  let added = 0;
  for (const m of incoming) {
    const key = m.email?.toLowerCase() || m.name?.toLowerCase() || "";
    if (key && seen.has(key)) continue;
    seen.add(key);
    existing.push(m);
    added += 1;
  }

  await db
    .from("student_outreach")
    .update({ research_data: { ...rd, office_members: existing }, viewed_at: null })
    .eq("id", office.id);

  return NextResponse.json({ ok: true, office_id: office.id, added });
}
