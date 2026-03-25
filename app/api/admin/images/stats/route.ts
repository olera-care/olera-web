import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/images/stats
 *
 * Aggregate image classification stats for the admin dashboard.
 * Uses count queries instead of fetching all rows into memory.
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

    // Run all counts in parallel instead of fetching all rows
    let needsReview = 0;
    let hasGoodPhoto = 0;
    let logoOnly = 0;
    let totalClassified = 0;

    try {
      const [needsReviewRes, photoRes, logoRes, classifiedRes] = await Promise.all([
        // Providers with low-confidence images (needs review)
        db
          .from("provider_image_metadata")
          .select("provider_id", { count: "exact", head: true })
          .lt("classification_confidence", 0.7),
        // Providers with a photo
        db
          .from("provider_image_metadata")
          .select("provider_id", { count: "exact", head: true })
          .eq("image_type", "photo"),
        // Providers with only a logo (no photo)
        db
          .from("provider_image_metadata")
          .select("provider_id", { count: "exact", head: true })
          .eq("image_type", "logo"),
        // Total classified providers
        db
          .from("provider_image_metadata")
          .select("provider_id", { count: "exact", head: true }),
      ]);

      needsReview = needsReviewRes.count ?? 0;
      hasGoodPhoto = photoRes.count ?? 0;
      logoOnly = Math.max(0, (logoRes.count ?? 0) - hasGoodPhoto);
      totalClassified = classifiedRes.count ?? 0;
    } catch {
      // Table doesn't exist yet
    }

    // Count total non-deleted providers
    const { count: totalProviders } = await db
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .or("deleted.is.null,deleted.eq.false");

    const noImages = Math.max(0, (totalProviders || 0) - totalClassified);

    return NextResponse.json({
      needs_review: needsReview,
      has_good_photo: hasGoodPhoto,
      logo_only: logoOnly,
      no_images: noImages,
      total_classified: totalClassified,
    });
  } catch (err) {
    console.error("Admin image stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
