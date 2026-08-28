import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { checkDestination, type DestinationCheckResult } from "@/lib/ad-boost/destination-check";

/**
 * Ad Boost destination coherence gate (plan gate G4).
 *
 * GET — checks whether a provider's public page is coherent enough to buy
 * clicks to. Run this BEFORE flipping a flight live.
 *
 *   /api/admin/ad-boost/destination-check?slug=graceful-homecare
 *   /api/admin/ad-boost/destination-check?campaign=<ad_campaign_requests.id>
 *   /api/admin/ad-boost/destination-check?scope=active   ← every non-ended flight
 *
 * GET on purpose: this is triggered from a browser by an operator, not curl.
 * The WAF challenges curl, and the people who need this are not running a
 * terminal.
 *
 * Auth: admin only.
 */

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const slug = params.get("slug");
  const campaignId = params.get("campaign");
  const scope = params.get("scope");
  const db = getServiceClient();

  // Resolve which provider slugs to check.
  let slugs: string[] = [];

  if (slug) {
    slugs = [slug];
  } else if (campaignId) {
    const { data: row, error } = await db
      .from("ad_campaign_requests")
      .select("provider_slug")
      .eq("id", campaignId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!row?.provider_slug) {
      return NextResponse.json({ error: "Campaign not found or has no provider_slug" }, { status: 404 });
    }
    slugs = [row.provider_slug];
  } else if (scope === "active") {
    const { data: rows, error } = await db
      .from("ad_campaign_requests")
      .select("provider_slug")
      .in("status", ["pending_profile", "requested", "scheduled", "live"])
      .is("deleted_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    slugs = [...new Set((rows ?? []).map((r) => r.provider_slug).filter(Boolean) as string[])];
  } else {
    return NextResponse.json(
      { error: "Pass ?slug=, ?campaign=, or ?scope=active" },
      { status: 400 },
    );
  }

  if (slugs.length === 0) {
    return NextResponse.json({ checked: 0, blocked: 0, results: [] });
  }

  const { data: profiles, error: profErr } = await db
    .from("business_profiles")
    .select("slug, category, state, metadata")
    .in("slug", slugs);
  if (profErr) {
    console.error("[ad-boost/destination-check] profile fetch failed:", profErr);
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const found = new Map((profiles ?? []).map((p) => [p.slug, p]));
  const results: DestinationCheckResult[] = [];

  for (const s of slugs) {
    const p = found.get(s);
    if (!p) {
      // A flight pointing at a slug with no profile is itself a blocker.
      results.push({
        slug: s,
        passes: false,
        priceSource: "contact_only",
        findings: [
          {
            code: "profile_missing",
            severity: "blocker",
            message: "No business_profiles row for this slug. The ad would point at a page we cannot verify.",
          },
        ],
      });
      continue;
    }
    results.push(
      checkDestination({
        slug: p.slug,
        category: p.category,
        state: p.state,
        metadata: p.metadata as never,
      }),
    );
  }

  // Blockers first, then warnings, then clean — an operator reads the top.
  results.sort((a, b) => {
    const score = (r: DestinationCheckResult) =>
      r.passes ? (r.findings.length ? 1 : 2) : 0;
    return score(a) - score(b);
  });

  return NextResponse.json({
    checked: results.length,
    blocked: results.filter((r) => !r.passes).length,
    results,
  });
}
