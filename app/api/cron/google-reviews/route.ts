import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { fetchGoogleReviews } from "@/lib/google-places";
import type { GoogleReviewsData } from "@/lib/types";

/**
 * GET /api/cron/google-reviews
 *
 * Tiered monthly cron — refreshes Google review data for providers based on activity.
 *
 * Tier 1: Claimed/verified providers — refresh if >30 days stale
 * Tier 2: Recently viewed providers (last 30 days) — refresh if >30 days stale
 * Tier 3: Long tail — refresh if >90 days stale or never synced
 *
 * Runs 1st of each month at 3 AM UTC.
 * Cost: ~$100/month at 100K providers (vs $500 for blind refresh).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const stats = { tier1: 0, tier2: 0, tier3: 0, updated: 0, errors: 0, skipped: 0 };

  try {
    // ── Tier 1: Claimed providers with stale data ──
    // These are providers who've claimed their page (have a matching business_profile)
    const { data: claimedSlugs } = await db
      .from("business_profiles")
      .select("slug")
      .eq("claim_state", "claimed")
      .not("slug", "is", null);

    const claimedSlugSet = new Set((claimedSlugs ?? []).map((r) => r.slug));

    // ── Fetch all providers needing refresh ──
    // Single query: has place_id, not deleted, stale or never synced
    const { data: providers, error: fetchErr } = await db
      .from("olera-providers")
      .select("provider_id, place_id, slug, google_reviews_data, last_viewed_at")
      .eq("deleted", false)
      .not("place_id", "is", null)
      .limit(5000);

    if (fetchErr) {
      console.error("[google-reviews-cron] Failed to fetch providers:", fetchErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!providers?.length) {
      return NextResponse.json({ message: "No providers to refresh", stats });
    }

    // Categorize into tiers
    const toRefresh: { provider_id: string; place_id: string; tier: number }[] = [];

    for (const p of providers) {
      const existing = p.google_reviews_data as GoogleReviewsData | null;
      const lastSynced = existing?.last_synced ? new Date(existing.last_synced) : null;
      const isClaimed = claimedSlugSet.has(p.slug);
      const wasViewedRecently = p.last_viewed_at && new Date(p.last_viewed_at) > new Date(thirtyDaysAgo);

      if (isClaimed && (!lastSynced || lastSynced < new Date(thirtyDaysAgo))) {
        toRefresh.push({ provider_id: p.provider_id, place_id: p.place_id, tier: 1 });
        stats.tier1++;
      } else if (wasViewedRecently && (!lastSynced || lastSynced < new Date(thirtyDaysAgo))) {
        toRefresh.push({ provider_id: p.provider_id, place_id: p.place_id, tier: 2 });
        stats.tier2++;
      } else if (!lastSynced || lastSynced < new Date(ninetyDaysAgo)) {
        toRefresh.push({ provider_id: p.provider_id, place_id: p.place_id, tier: 3 });
        stats.tier3++;
      } else {
        stats.skipped++;
      }
    }

    // Process in batches (50 at a time, 200ms delay)
    const BATCH_SIZE = 50;
    const DELAY_MS = 200;

    for (let i = 0; i < toRefresh.length; i += BATCH_SIZE) {
      const batch = toRefresh.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (p) => {
          const data = await fetchGoogleReviews(p.place_id);
          if (!data) return null;

          const { error: updateErr } = await db
            .from("olera-providers")
            .update({ google_reviews_data: data })
            .eq("provider_id", p.provider_id);

          if (updateErr) {
            console.error(`[google-reviews-cron] Update failed for ${p.provider_id}:`, updateErr);
            throw updateErr;
          }

          return p.provider_id;
        }),
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) stats.updated++;
        else if (r.status === "rejected") stats.errors++;
      }

      // Rate limit between batches
      if (i + BATCH_SIZE < toRefresh.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    const costEstimate = ((stats.tier1 + stats.tier2 + stats.tier3) / 1000) * 5;
    console.log(
      `[google-reviews-cron] Done. T1:${stats.tier1} T2:${stats.tier2} T3:${stats.tier3} updated:${stats.updated} errors:${stats.errors} skipped:${stats.skipped} est_cost:$${costEstimate.toFixed(2)}`,
    );

    return NextResponse.json({
      message: "Google reviews refresh complete",
      stats,
      estimated_cost: `$${costEstimate.toFixed(2)}`,
    });
  } catch (err) {
    console.error("[google-reviews-cron] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
