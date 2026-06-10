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
      .select("name, city, state")
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
