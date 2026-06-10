import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  buildSourceMap,
  extractPartners,
  PARTNER_SUBTYPES,
  type PartnerSubtype,
  type SourceLink,
  type UniversityContext,
} from "@/lib/medjobs/partner-sourcing";

/**
 * POST /api/admin/medjobs/source-partners
 *
 * AI partner-sourcing accelerator (Chunk 1.1). Read-only research tool — it
 * writes NOTHING to student_outreach (mirrors enrich-contact). The widget
 * (Chunk 1.2) reviews the output and accepts candidates through the existing
 * POST /api/admin/student-outreach/stakeholders path.
 *
 * Body:
 *   {
 *     campus_slug: string,
 *     subtype: "advisor" | "student_org" | "dept_head",
 *     stage:   "source_map" | "extract",
 *     departments?: string[],   // optional scope (dept_head focus)
 *     sources?: SourceLink[]     // (extract) pages to prioritize, from a prior source_map
 *   }
 *
 * Returns:
 *   stage=source_map → { sources: SourceLink[], cost }
 *   stage=extract    → { candidates: PartnerCandidate[], cost }
 *
 * Node runtime + long-ish timeout: Perplexity Sonar with search is slow.
 */
export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_STAGES = new Set(["source_map", "extract"]);
const STAKEHOLDER_KINDS = ["advisor", "student_org", "dept_head", "professor"];

/**
 * GET /api/admin/medjobs/source-partners?campus_slug=...
 *
 * Dedup helper for the sourcing widget — returns the existing partner rows'
 * names + emails for a Site so the review table can flag "already a prospect."
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const campusSlug = request.nextUrl.searchParams.get("campus_slug")?.trim();
  if (!campusSlug) {
    return NextResponse.json({ error: "campus_slug is required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("id, partner_research")
    .eq("slug", campusSlug)
    .maybeSingle();
  if (!campus) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const { data: rows } = await db
    .from("student_outreach")
    .select("organization_name, research_data")
    .eq("campus_id", (campus as { id: string }).id)
    .in("kind", STAKEHOLDER_KINDS);

  const names = new Set<string>();
  const emails = new Set<string>();
  for (const r of (rows ?? []) as Array<{
    organization_name: string | null;
    research_data: Record<string, unknown> | null;
  }>) {
    if (r.organization_name) names.add(r.organization_name.trim().toLowerCase());
    const rd = (r.research_data ?? {}) as Record<string, unknown>;
    const gc = (rd.general_contact ?? {}) as Record<string, unknown>;
    const sl = (rd.smartlead ?? {}) as Record<string, unknown>;
    for (const e of [gc.email, rd.org_email, sl.lead_email]) {
      if (typeof e === "string" && e.trim()) emails.add(e.trim().toLowerCase());
    }
  }
  const pr = ((campus as { partner_research?: Record<string, unknown> }).partner_research ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    names: [...names],
    emails: [...emails],
    partner_research: { sources: pr.sources ?? {}, audit: pr.audit ?? {} },
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = (await request.json()) as {
      campus_slug?: string;
      subtype?: string;
      stage?: string;
      departments?: unknown;
      sources?: unknown;
    };

    const campusSlug = body.campus_slug?.trim();
    const subtype = body.subtype as PartnerSubtype | undefined;
    const stage = body.stage;

    if (!campusSlug) {
      return NextResponse.json({ error: "campus_slug is required" }, { status: 400 });
    }
    if (!subtype || !PARTNER_SUBTYPES.includes(subtype)) {
      return NextResponse.json(
        { error: "subtype must be one of: advisor, student_org, dept_head" },
        { status: 400 },
      );
    }
    if (!stage || !VALID_STAGES.has(stage)) {
      return NextResponse.json(
        { error: "stage must be 'source_map' or 'extract'" },
        { status: 400 },
      );
    }

    const db = getServiceClient();
    const { data: campus, error } = await db
      .from("student_outreach_campuses")
      .select("id, name, city, state, partner_research")
      .eq("slug", campusSlug)
      .maybeSingle();
    if (error || !campus) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const departments = Array.isArray(body.departments)
      ? (body.departments as unknown[]).map(String).map((s) => s.trim()).filter(Boolean)
      : undefined;

    const ctx: UniversityContext = {
      university: (campus.name as string) || campusSlug,
      city: (campus.city as string | null) ?? null,
      state: (campus.state as string | null) ?? null,
      departments,
    };

    if (stage === "source_map") {
      const { sources, cost } = await buildSourceMap(ctx, subtype);
      // Persist the source map on the Site (R4) so it's reusable for the
      // manual audit + later research without re-paying for it.
      const pr = ((campus as { partner_research?: Record<string, unknown> }).partner_research ?? {}) as Record<string, unknown>;
      const prSources = (pr.sources ?? {}) as Record<string, unknown>;
      await db
        .from("student_outreach_campuses")
        .update({ partner_research: { ...pr, sources: { ...prSources, [subtype]: sources } } })
        .eq("id", (campus as { id: string }).id);
      return NextResponse.json({ sources, cost });
    }

    // stage === "extract" — accept an optional prior source map to prioritize.
    let sources: SourceLink[] | undefined;
    if (Array.isArray(body.sources)) {
      sources = (body.sources as unknown[])
        .map((s) => s as Record<string, unknown>)
        .filter((s) => typeof s.url === "string")
        .map((s) => ({
          title: String(s.title ?? s.url),
          url: String(s.url),
          tier: "secondary" as const,
        }));
    }
    const { candidates, cost } = await extractPartners(ctx, subtype, sources);
    return NextResponse.json({ candidates, cost });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sourcing failed" },
      { status: 500 },
    );
  }
}
