import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/images/stats
 *
 * Aggregate image classification stats for the admin dashboard.
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

    // Fetch all image metadata for aggregation
    // Table may not exist yet if migrations haven't run
    let images: { provider_id: string; image_type: string; classification_confidence: number; is_accessible: boolean }[] = [];
    try {
      const { data, error } = await db
        .from("provider_image_metadata")
        .select("provider_id, image_type, classification_confidence, is_accessible");

      if (!error && data) {
        images = data;
      }
    } catch {
      // Table doesn't exist yet
    }

    // Aggregate per provider
    const providers = new Map<string, {
      hasPhoto: boolean;
      hasLogo: boolean;
      minConfidence: number;
    }>();

    for (const img of images || []) {
      const existing = providers.get(img.provider_id) || {
        hasPhoto: false,
        hasLogo: false,
        minConfidence: 1.0,
      };

      if (img.image_type === "photo") existing.hasPhoto = true;
      if (img.image_type === "logo") existing.hasLogo = true;
      if (img.classification_confidence < existing.minConfidence) {
        existing.minConfidence = img.classification_confidence;
      }

      providers.set(img.provider_id, existing);
    }

    // Count total providers (including those with no images)
    const { count: totalProviders } = await db
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .or("deleted.is.null,deleted.eq.false");

    let needsReview = 0;
    let hasGoodPhoto = 0;
    let logoOnly = 0;

    for (const [, stats] of providers) {
      if (stats.minConfidence < 0.7) needsReview++;
      if (stats.hasPhoto) hasGoodPhoto++;
      else if (stats.hasLogo) logoOnly++;
    }

    const classifiedProviders = providers.size;
    const noImages = (totalProviders || 0) - classifiedProviders;

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
