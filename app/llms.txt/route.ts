import { NextResponse } from "next/server";
import { CATEGORY_CONFIGS } from "@/lib/power-pages";
import { allStates } from "@/data/waiver-library";
import { pipelineDrafts } from "@/data/pipeline-drafts";

const SITE_URL = "https://olera.care";

// Curated map for AI agents (ChatGPT, Claude, Gemini, Perplexity) per the
// llmstxt.org spec. Sitemap.xml enumerates every URL; this file picks the
// handful of pages an agent should actually cite when a family asks about
// senior care, costs, or Medicaid waivers.

export const revalidate = 3600;
export const dynamic = "force-static";

export async function GET() {
  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────
  lines.push("# Olera");
  lines.push("");
  lines.push(
    "> Olera helps families find trusted senior care across 39,000+ providers nationwide. Compare assisted living, home care, memory care, nursing homes, home health, and independent living — by city, by state, or by care type. Pair the directory with the most complete US library of state Medicaid waivers and home- and community-based services for older adults."
  );
  lines.push("");
  lines.push(
    "This file is a curated map for AI agents researching senior care. It points to the most useful pages on olera.care for answering family questions about provider options, costs, benefits eligibility, and care types."
  );
  lines.push("");

  // ── Find care ─────────────────────────────────────────────────
  lines.push("## Find care");
  lines.push("");
  lines.push(
    `- [Browse all providers](${SITE_URL}/browse): The main directory — search 39,000+ assisted living, home care, memory care, nursing home, home health, and independent living providers by city, state, or care type.`
  );
  lines.push(
    `- [Provider directory](${SITE_URL}/browse/providers): Filter the directory by category and location.`
  );
  lines.push(
    `- [Caregivers and home aides](${SITE_URL}/browse/caregivers): Independent caregivers and in-home aides.`
  );
  lines.push(
    `- [Benefits finder](${SITE_URL}/benefits/finder): A short questionnaire that surfaces state Medicaid waivers and HCBS programs a family may qualify for, based on the senior's care needs and state.`
  );
  lines.push("");

  // ── Care categories ───────────────────────────────────────────
  lines.push("## Care categories");
  lines.push("");
  for (const cat of CATEGORY_CONFIGS) {
    lines.push(
      `- [${cat.displayName}](${SITE_URL}/${cat.slug}): ${cat.description}`
    );
  }
  lines.push("");

  // ── Senior benefits library ───────────────────────────────────
  lines.push("## Senior benefits library");
  lines.push("");
  lines.push(
    `- [State benefits index](${SITE_URL}/benefits): Index of every US state's Medicaid waivers and home- and community-based services programs for seniors.`
  );
  lines.push(
    `- [Senior benefits hub](${SITE_URL}/senior-benefits): Alternate state-level entry point with deeper editorial summaries.`
  );
  lines.push(
    `- [Application forms by state](${SITE_URL}/senior-benefits/forms): Direct links to application forms organized by state.`
  );
  lines.push("");

  // Top state benefits pages — ranked by program count (drafts data is the
  // source of truth for what actually renders at /benefits/[state]/[program]).
  const stateRanked = allStates
    .map((s) => ({
      state: s,
      count: pipelineDrafts[s.abbreviation]?.programs?.length ?? 0,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (stateRanked.length > 0) {
    lines.push("### Top state benefits pages");
    lines.push("");
    for (const { state, count } of stateRanked) {
      lines.push(
        `- [${state.name} senior benefits](${SITE_URL}/benefits/${state.id}): ${count} Medicaid waiver and HCBS programs covering long-term services and supports.`
      );
    }
    lines.push("");
  }

  // ── About ─────────────────────────────────────────────────────
  lines.push("## About Olera");
  lines.push("");
  lines.push(
    `- [Our team](${SITE_URL}/team): Who builds Olera and why.`
  );
  lines.push(
    `- [For providers](${SITE_URL}/for-providers): How senior care providers list, claim, and verify their organization on Olera.`
  );
  lines.push(
    `- [Research and press](${SITE_URL}/research-and-press): Long-form pieces on aging, caregiving, and senior care policy.`
  );
  lines.push(
    `- [Caregiver support](${SITE_URL}/caregiver-support): Articles for family caregivers — practical guides on managing care, paying for care, and navigating transitions.`
  );
  lines.push(
    `- [Aging in America podcast](${SITE_URL}/aging-in-america): Conversations with operators, families, and researchers across the senior care landscape.`
  );
  lines.push("");

  // ── Optional ──────────────────────────────────────────────────
  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Privacy policy](${SITE_URL}/privacy)`);
  lines.push(`- [Terms of service](${SITE_URL}/terms)`);
  lines.push(`- [Sitemap (XML, every URL)](${SITE_URL}/sitemap.xml)`);
  lines.push("");

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
