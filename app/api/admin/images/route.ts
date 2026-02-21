import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/images
 *
 * List providers with image classification status.
 * Query params: status, category, limit, offset, count_only
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

    // Step 1: Get image stats per provider from provider_image_metadata
    // Table may not exist yet if migrations haven't run — gracefully handle
    let imageStats: { provider_id: string; image_type: string; classification_confidence: number; is_hero: boolean }[] = [];
    try {
      const { data, error: statsError } = await db
        .from("provider_image_metadata")
        .select("provider_id, image_type, classification_confidence, is_hero");

      if (!statsError && data) {
        imageStats = data;
      }
    } catch {
      // Table doesn't exist yet — proceed with empty stats
    }

    // Aggregate stats per provider
    const providerStats = new Map<string, {
      image_count: number;
      photo_count: number;
      logo_count: number;
      min_confidence: number;
      has_hero: boolean;
    }>();

    for (const row of imageStats || []) {
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

    // Determine which providers match the status filter
    const allProviderIds = new Set<string>();

    // Step 2: Get all provider IDs (we need to include providers with no images for "no_images")
    let providerQuery = db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, hero_image_url, provider_images, provider_logo")
      .or("deleted.is.null,deleted.eq.false")
      .order("provider_name", { ascending: true });

    if (category) {
      providerQuery = providerQuery.eq("provider_category", category);
    }

    const { data: allProviders, error: providerError } = await providerQuery;

    if (providerError) {
      console.error("Failed to fetch providers:", providerError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    // Filter providers based on status
    const filteredProviders = (allProviders || []).filter((p) => {
      const pStats = providerStats.get(p.provider_id);

      switch (status) {
        case "needs_review":
          return pStats && pStats.min_confidence < 0.7;
        case "has_photo":
          return pStats && pStats.photo_count > 0;
        case "logo_only":
          return pStats && pStats.image_count > 0 && pStats.photo_count === 0;
        case "no_images":
          return !pStats || pStats.image_count === 0;
        case "all":
          return true;
        default:
          return true;
      }
    });

    if (countOnly) {
      return NextResponse.json({ count: filteredProviders.length });
    }

    // Paginate
    const paged = filteredProviders.slice(offset, offset + limit);

    const providers = paged.map((p) => {
      const pStats = providerStats.get(p.provider_id);

      // Parse raw images for thumbnail + count when no classified data
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

    return NextResponse.json({ providers, total: filteredProviders.length });
  } catch (err) {
    console.error("Admin images error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
