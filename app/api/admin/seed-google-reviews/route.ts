import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getAuthUser, isMasterAdmin } from "@/lib/admin";
import { fetchGoogleReviews } from "@/lib/google-places";

/**
 * POST /api/admin/seed-google-reviews
 *
 * Initial seed of Google review data. Admin-auth protected.
 *
 * Query params:
 *   ?limit=100        — max providers to process (default 100)
 *   &offset=0         — skip first N eligible providers (default 0)
 *   &dry_run=true     — just count eligible providers, don't fetch
 *   &force=true       — re-fetch even if already synced
 *   &require_rating=true — only providers with google_rating > 0 (default true)
 *   &categories=Home Care (Non-medical),Assisted Living — filter by provider_category (comma-separated)
 *
 * Usage:
 *   1. First call with ?dry_run=true to see count + cost estimate
 *   2. Then batch: ?limit=100&offset=0, ?limit=100&offset=100, etc.
 *   3. For targeted backfill: ?categories=Home Care (Non-medical),Assisted Living&dry_run=true
 */
export async function POST(request: NextRequest) {
  // Auth check
  const user = await getAuthUser();
  if (!user || !(await isMasterAdmin(user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const dryRun = searchParams.get("dry_run") === "true";
  const force = searchParams.get("force") === "true";
  const requireRating = searchParams.get("require_rating") !== "false";
  const categoriesParam = searchParams.get("categories");
  const categories = categoriesParam ? categoriesParam.split(",").map((c) => c.trim()).filter(Boolean) : null;

  const db = getServiceClient();

  try {
    // Build query for eligible providers
    let countQuery = db
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .eq("deleted", false)
      .not("place_id", "is", null);

    if (requireRating) {
      countQuery = countQuery.not("google_rating", "is", null).gt("google_rating", 0);
    }

    if (!force) {
      countQuery = countQuery.is("google_reviews_data", null);
    }

    if (categories) {
      countQuery = countQuery.in("provider_category", categories);
    }

    const { count: totalEligible, error: countErr } = await countQuery;

    if (countErr) {
      console.error("[seed-google-reviews] Count query failed:", countErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const costEstimate = ((totalEligible ?? 0) / 1000) * 5;

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        total_eligible: totalEligible,
        estimated_cost: `$${costEstimate.toFixed(2)}`,
        filters: { require_rating: requireRating, force, categories: categories ?? "all" },
        message: `${totalEligible} providers eligible. Run without dry_run=true to seed.`,
      });
    }

    // Fetch the batch
    let dataQuery = db
      .from("olera-providers")
      .select("provider_id, place_id, provider_name")
      .eq("deleted", false)
      .not("place_id", "is", null)
      .order("provider_id", { ascending: true })
      .range(offset, offset + limit - 1);

    if (requireRating) {
      dataQuery = dataQuery.not("google_rating", "is", null).gt("google_rating", 0);
    }

    if (!force) {
      dataQuery = dataQuery.is("google_reviews_data", null);
    }

    if (categories) {
      dataQuery = dataQuery.in("provider_category", categories);
    }

    const { data: providers, error: fetchErr } = await dataQuery;

    if (fetchErr) {
      console.error("[seed-google-reviews] Fetch failed:", fetchErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!providers?.length) {
      return NextResponse.json({
        message: "No providers in this batch",
        offset,
        limit,
        total_eligible: totalEligible,
        processed: 0,
      });
    }

    // Process with rate limiting
    const BATCH_SIZE = 50;
    const DELAY_MS = 200;
    let updated = 0;
    let errors = 0;
    let noReviews = 0;

    for (let i = 0; i < providers.length; i += BATCH_SIZE) {
      const batch = providers.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (p) => {
          const data = await fetchGoogleReviews(p.place_id);
          if (!data) {
            noReviews++;
            return null;
          }

          const { error: updateErr } = await db
            .from("olera-providers")
            .update({ google_reviews_data: data })
            .eq("provider_id", p.provider_id);

          if (updateErr) {
            console.error(`[seed-google-reviews] Update failed for ${p.provider_id}:`, updateErr);
            throw updateErr;
          }

          return p.provider_id;
        }),
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) updated++;
        else if (r.status === "rejected") errors++;
      }

      if (i + BATCH_SIZE < providers.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    const batchCost = (providers.length / 1000) * 5;

    return NextResponse.json({
      message: "Seed batch complete",
      offset,
      limit,
      total_eligible: totalEligible,
      processed: providers.length,
      updated,
      no_reviews: noReviews,
      errors,
      batch_cost: `$${batchCost.toFixed(2)}`,
      next_offset: offset + limit < (totalEligible ?? 0) ? offset + limit : null,
    });
  } catch (err) {
    console.error("[seed-google-reviews] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
