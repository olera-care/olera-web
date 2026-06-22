/**
 * GET   /api/admin/medjobs/research-workspace?campus_slug=...&subtype=...
 * PATCH /api/admin/medjobs/research-workspace
 *
 * Read/write the Site's research workspace (links + offices + members) for one
 * partner subtype. State lives in student_outreach_campuses.partner_research
 * .workspace[subtype] — no new table. This is the research LAYER; prospects are
 * only created later by the /generate sibling route.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { PARTNER_SUBTYPES, type PartnerSubtype } from "@/lib/medjobs/partner-sourcing";
import {
  readWorkspace,
  writeWorkspace,
  type WorkspaceState,
} from "@/lib/medjobs/research-workspace";

function validSubtype(s: string | null | undefined): s is PartnerSubtype {
  return !!s && (PARTNER_SUBTYPES as string[]).includes(s);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const campusSlug = request.nextUrl.searchParams.get("campus_slug")?.trim();
  const subtype = request.nextUrl.searchParams.get("subtype")?.trim();
  if (!campusSlug) return NextResponse.json({ error: "campus_slug required" }, { status: 400 });
  if (!validSubtype(subtype)) return NextResponse.json({ error: "Invalid subtype" }, { status: 400 });

  const db = getServiceClient();
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("partner_research")
    .eq("slug", campusSlug)
    .maybeSingle();
  if (!campus) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const pr = ((campus as { partner_research?: unknown }).partner_research ?? {}) as Record<string, unknown>;
  const workspace = readWorkspace(pr, subtype);
  const audit = (pr.audit ?? {}) as Record<string, unknown>;
  // C1: per-subtype progress so the workspace tabs can show counts for all
  // three types at once (kept links + verified offices).
  const summary: Record<string, { kept: number; verified: number }> = {};
  for (const st of ["advisor", "student_org", "dept_head"] as PartnerSubtype[]) {
    const w = readWorkspace(pr, st);
    summary[st] = { kept: w.links.length, verified: w.offices.filter((o) => o.verified).length };
  }
  return NextResponse.json({ workspace, audit: audit[subtype] ?? null, summary });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: { campus_slug?: string; subtype?: string; workspace?: Partial<WorkspaceState> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const campusSlug = body.campus_slug?.trim();
  const subtype = body.subtype?.trim();
  if (!campusSlug) return NextResponse.json({ error: "campus_slug required" }, { status: 400 });
  if (!validSubtype(subtype)) return NextResponse.json({ error: "Invalid subtype" }, { status: 400 });
  if (!body.workspace || typeof body.workspace !== "object") {
    return NextResponse.json({ error: "workspace required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("id, partner_research")
    .eq("slug", campusSlug)
    .maybeSingle();
  if (!campus) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Only persist the workspace fields we own — never trust generated_at from the
  // client (that's set by the /generate route).
  const { links, searches, offices, advisors, suggested, last_step } = body.workspace;
  const patch: Partial<WorkspaceState> = {};
  if (Array.isArray(links)) patch.links = links;
  if (Array.isArray(searches)) patch.searches = searches;
  if (Array.isArray(offices)) patch.offices = offices;
  if (Array.isArray(advisors)) patch.advisors = advisors;
  if (Array.isArray(suggested)) patch.suggested = suggested;
  if (typeof last_step === "string") patch.last_step = last_step;

  const nextPr = writeWorkspace(
    (campus as { partner_research?: unknown }).partner_research,
    subtype,
    patch,
  );
  const { error } = await db
    .from("student_outreach_campuses")
    .update({ partner_research: nextPr, updated_at: new Date().toISOString() })
    .eq("id", (campus as { id: string }).id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
