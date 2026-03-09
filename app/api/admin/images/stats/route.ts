import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/images/stats
 *
 * Aggregate image classification stats for the admin dashboard.
 * Optimized: fetches only provider_id column and uses parallel queries.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    let needsReview = 0;
    let hasGoodPhoto = 0;
    let logoOnly = 0;
    let classifiedProviders = 0;
    let totalProviders = 0;

    try {
      // Run all queries in parallel — only fetching provider_id (minimal payload)
      const [
        allMetadataRes,
        lowConfRes,
        photoRes,
        totalProvidersRes,
      ] = await Promise.all([
        // All classified provider_ids (for distinct count)
        db.from("provider_image_metadata").select("provider_id"),
        // Provider_ids with low confidence (needs review)
        db.from("provider_image_metadata").select("provider_id").lt("classification_confidence", 0.7),
        // Provider_ids with photos
        db.from("provider_image_metadata").select("provider_id").eq("image_type", "photo"),
        // Total active providers count
        db.from("olera-providers").select("provider_id", { count: "exact", head: true }).or("deleted.is.null,deleted.eq.false"),
      ]);

      totalProviders = totalProvidersRes.count || 0;

      // Deduplicate provider_ids in memory (lightweight — only string arrays)
      const allProviderIds = new Set((allMetadataRes.data || []).map((r: any) => r.provider_id));
      const lowConfProviderIds = new Set((lowConfRes.data || []).map((r: any) => r.provider_id));
      const photoProviderIds = new Set((photoRes.data || []).map((r: any) => r.provider_id));

      classifiedProviders = allProviderIds.size;
      needsReview = lowConfProviderIds.size;
      hasGoodPhoto = photoProviderIds.size;

      // Logo-only = classified but has no photo
      for (const pid of allProviderIds) {
        if (!photoProviderIds.has(pid)) logoOnly++;
      }
    } catch {
      // Table doesn't exist yet — return zeroes
    }

    const noImages = totalProviders - classifiedProviders;

    return NextResponse.json({
      needs_review: needsReview,
      has_good_photo: hasGoodPhoto,
      logo_only: logoOnly,
      no_images: noImages,
      total_classified: classifiedProviders,
    });
  } catch (err) {
    console.error("Admin image stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
