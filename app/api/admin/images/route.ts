import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/images
 *
 * List providers with image classification status.
 * Query params: status, category, limit, offset, count_only
 *
 * Optimized: uses DB-level filtering and fetches only needed columns.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "needs_review";
    const category = searchParams.get("category");
    const countOnly = searchParams.get("count_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getServiceClient();

    // Step 1: Get image stats per provider (only provider_id + needed fields)
    let imageStats: { provider_id: string; image_type: string; classification_confidence: number; is_hero: boolean }[] = [];
    try {
      const { data, error: statsError } = await db
        .from("provider_image_metadata")
        .select("provider_id, image_type, classification_confidence, is_hero");

      if (!statsError && data) {
        imageStats = data;
      }
    } catch {
      // Table doesn't exist yet
    }

    // Aggregate stats per provider
    const providerStats = new Map<string, {
      image_count: number;
      photo_count: number;
      logo_count: number;
      min_confidence: number;
      has_hero: boolean;
    }>();

    for (const row of imageStats) {
      const existing = providerStats.get(row.provider_id) || {
        image_count: 0,
        photo_count: 0,
        logo_count: 0,
        min_confidence: 1.0,
        has_hero: false,
      };

      existing.image_count++;
      if (row.image_type === "photo") existing.photo_count++;
      if (row.image_type === "logo") existing.logo_count++;
      if (row.classification_confidence < existing.min_confidence) {
        existing.min_confidence = row.classification_confidence;
      }
      if (row.is_hero) existing.has_hero = true;

      providerStats.set(row.provider_id, existing);
    }

    // Determine matching provider IDs based on status filter
    let matchingProviderIds: Set<string> | null = null; // null = all providers
    const classifiedIds = new Set(providerStats.keys());

    switch (status) {
      case "needs_review": {
        matchingProviderIds = new Set<string>();
        for (const [pid, stats] of providerStats) {
          if (stats.min_confidence < 0.7) matchingProviderIds.add(pid);
        }
        break;
      }
      case "has_photo": {
        matchingProviderIds = new Set<string>();
        for (const [pid, stats] of providerStats) {
          if (stats.photo_count > 0) matchingProviderIds.add(pid);
        }
        break;
      }
      case "logo_only": {
        matchingProviderIds = new Set<string>();
        for (const [pid, stats] of providerStats) {
          if (stats.image_count > 0 && stats.photo_count === 0) matchingProviderIds.add(pid);
        }
        break;
      }
      case "no_images":
        // Will filter after fetching providers (need those NOT in classifiedIds)
        break;
      case "all":
      default:
        break;
    }

    // Step 2: Fetch providers — use .in() filter when we know the exact IDs
    let providerQuery = db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, hero_image_url, provider_images, provider_logo", { count: "exact" })
      .or("deleted.is.null,deleted.eq.false")
      .order("provider_name", { ascending: true });

    if (category) {
      providerQuery = providerQuery.eq("provider_category", category);
    }

    // For statuses where we know the exact provider IDs, filter at DB level
    if (matchingProviderIds !== null && status !== "no_images") {
      const ids = Array.from(matchingProviderIds);
      if (ids.length === 0) {
        return NextResponse.json(countOnly ? { count: 0 } : { providers: [], total: 0 });
      }
      providerQuery = providerQuery.in("provider_id", ids);
    }

    // For count-only, use head: true to skip fetching rows
    if (countOnly && status !== "no_images") {
      const { count } = await db
        .from("olera-providers")
        .select("provider_id", { count: "exact", head: true })
        .or("deleted.is.null,deleted.eq.false")
        .in("provider_id", matchingProviderIds ? Array.from(matchingProviderIds) : Array.from(classifiedIds));
      return NextResponse.json({ count: status === "all" ? undefined : (count ?? 0) });
    }

    // Apply pagination at DB level when possible
    if (status !== "no_images") {
      providerQuery = providerQuery.range(offset, offset + limit - 1);
    }

    const { data: allProviders, count: dbCount, error: providerError } = await providerQuery;

    if (providerError) {
      console.error("Failed to fetch providers:", providerError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    let filteredProviders = allProviders || [];
    let total = dbCount ?? filteredProviders.length;

    // For no_images, we need to filter out classified providers in memory
    if (status === "no_images") {
      filteredProviders = filteredProviders.filter((p) => !classifiedIds.has(p.provider_id));
      total = filteredProviders.length;

      if (countOnly) {
        return NextResponse.json({ count: total });
      }

      // Paginate in memory for no_images
      filteredProviders = filteredProviders.slice(offset, offset + limit);
    }

    const providers = filteredProviders.map((p) => {
      const pStats = providerStats.get(p.provider_id);

      const rawImages: string[] = [];
      if (p.provider_images) {
        const parsed = (p.provider_images as string).split(" | ").map((u: string) => u.trim()).filter(Boolean);
        rawImages.push(...parsed);
      }

      return {
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        provider_category: p.provider_category,
        city: p.city,
        state: p.state,
        hero_image_url: p.hero_image_url,
        image_count: pStats?.image_count || 0,
        photo_count: pStats?.photo_count || 0,
        logo_count: pStats?.logo_count || 0,
        raw_image_count: rawImages.length + (p.provider_logo ? 1 : 0),
        first_image_url: p.hero_image_url || rawImages[0] || p.provider_logo || null,
        min_confidence: pStats?.min_confidence ?? null,
        needs_review: pStats ? pStats.min_confidence < 0.7 : false,
      };
    });

    return NextResponse.json({ providers, total });
  } catch (err) {
    console.error("Admin images error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
