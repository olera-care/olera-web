import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  buildSourceMap,
  extractPartners,
  extractFromUrl,
  extractFromText,
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

const VALID_STAGES = new Set(["source_map", "extract", "extract_url", "parse_text"]);
const STAKEHOLDER_KINDS = ["advisor", "student_org", "dept_head", "professor"];

/**
 * Fetch a page server-side and reduce it to plain text. Far more reliable than
 * asking the model to "browse" a URL — and because the model then only sees
 * REAL page text, it can't hallucinate contacts. Returns "" on failure (e.g.
 * JS-rendered SPA, 403, timeout) so the caller can fall back to model browsing
 * or the paste tool. mailto:/tel: hrefs are surfaced since the visible text
 * sometimes hides the address behind an icon.
 */
async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      // Browser-like headers — many university sites (e.g. Rice) return HTTP 406
      // to a bare bot User-Agent with no Accept header.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/xhtml/i.test(ct)) return "";
    const html = await res.text();
    const emails = [...html.matchAll(/mailto:([^"'>\s?]+)/gi)].map((m) => {
      try { return decodeURIComponent(m[1]); } catch { return m[1]; }
    });
    const tels = [...html.matchAll(/tel:([^"'>\s]+)/gi)].map((m) => m[1]);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const extras = [...new Set([...emails, ...tels])];
    return extras.length ? `${text}\n\nContact links on page: ${extras.join(", ")}` : text;
  } catch {
    return "";
  }
}

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
  // Flatten the admin's KEPT research links (all subtypes) — the approved
  // research record. Only links the admin kept in the workspace appear here.
  const workspace = (pr.workspace ?? {}) as Record<string, { links?: { title?: string; url?: string }[] }>;
  const seenLink = new Set<string>();
  const links: { title: string; url: string }[] = [];
  for (const subtypeWs of Object.values(workspace)) {
    for (const l of subtypeWs?.links ?? []) {
      if (l?.url && !seenLink.has(l.url)) {
        seenLink.add(l.url);
        links.push({ title: l.title ?? l.url, url: l.url });
      }
    }
  }
  return NextResponse.json({
    names: [...names],
    emails: [...emails],
    links,
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
      // Do NOT persist here. Discovery is just a suggestion — only links the
      // admin explicitly KEEPS in the workspace Link Set get saved to the Site
      // (via /research-workspace PATCH). This keeps "saved == approved".
      return NextResponse.json({ sources, cost });
    }

    if (stage === "extract_url") {
      const pageUrl = String((body as { url?: unknown }).url ?? "").trim();
      if (!/^https?:\/\//i.test(pageUrl)) {
        return NextResponse.json({ error: "Paste a valid http(s) URL" }, { status: 400 });
      }
      // Prefer reading the ACTUAL page text server-side — reliable and the model
      // can only structure real text (no hallucinated contacts). Fall back to
      // model browsing only when we couldn't fetch usable content (JS-rendered,
      // blocked, etc.), in which case the admin can also use the paste tool.
      const pageText = await fetchPageText(pageUrl);
      const usedText = pageText.length > 200;
      const { offices, cost } = usedText
        ? await extractFromText(ctx, subtype, pageText, pageUrl)
        : await extractFromUrl(ctx, subtype, pageUrl);
      return NextResponse.json({ offices, cost, source: usedText ? "page_text" : "browse" });
    }

    if (stage === "parse_text") {
      const text = String((body as { text?: unknown }).text ?? "").trim();
      if (text.length < 3) {
        return NextResponse.json({ error: "Paste some office text first." }, { status: 400 });
      }
      const sourceUrl = String((body as { url?: unknown }).url ?? "").trim();
      const { offices, cost } = await extractFromText(ctx, subtype, text, sourceUrl);
      return NextResponse.json({ offices, cost });
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
