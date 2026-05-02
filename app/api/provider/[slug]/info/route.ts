import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { fetchGooglePlacePhoto } from "@/lib/google-places";

/**
 * GET /api/provider/[slug]/info
 *
 * Fetch public provider info by slug. No auth required.
 * Used by the public review page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Try to find the provider by slug in business_profiles (only provider types)
    let profile = null;

    // First try: strict type filter (organization or caregiver)
    const { data: strictProfile } = await db
      .from("business_profiles")
      .select("id, display_name, slug, image_url, city, state, metadata, type, source_provider_id")
      .eq("slug", slug)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    profile = strictProfile;

    // Second try: if not found, search without type filter but exclude family/student
    // This handles older profiles that may have null or different types
    if (!profile) {
      const { data: lenientProfile } = await db
        .from("business_profiles")
        .select("id, display_name, slug, image_url, city, state, metadata, type, source_provider_id")
        .eq("slug", slug)
        .not("type", "in", "(family,student)")
        .maybeSingle();

      profile = lenientProfile;
    }

    if (!profile) {
      // Third try: legacy olera-providers table by slug
      let legacyProvider = null;

      const { data: bySlug } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, city, state, place_id, slug, provider_images")
        .eq("slug", slug)
        .not("deleted", "is", true)
        .maybeSingle();

      legacyProvider = bySlug;

      // Fourth try: legacy olera-providers by provider_id
      if (!legacyProvider) {
        const { data: byProviderId } = await db
          .from("olera-providers")
          .select("provider_id, provider_name, city, state, place_id, slug, provider_images")
          .eq("provider_id", slug)
          .not("deleted", "is", true)
          .maybeSingle();

        legacyProvider = byProviderId;
      }

      if (legacyProvider) {
        // Prefer cached photo URL from DB; only call Places API as last resort.
        let imageUrl: string | null = legacyProvider.provider_images || null;
        if (!imageUrl && legacyProvider.place_id) {
          imageUrl = await fetchGooglePlacePhoto(legacyProvider.place_id);
          if (imageUrl) {
            // Cache for next visitor — fire-and-forget, don't block response.
            db.from("olera-providers")
              .update({ provider_images: imageUrl })
              .eq("provider_id", legacyProvider.provider_id)
              .then(({ error }) => {
                if (error) console.warn("[info-route] photo write-back failed:", error.message);
              });
          }
        }

        const legacyResponse = NextResponse.json({
          provider: {
            id: legacyProvider.provider_id,
            display_name: legacyProvider.provider_name,
            slug: legacyProvider.slug || legacyProvider.provider_id,
            image_url: imageUrl,
            tagline: null,
            city: legacyProvider.city,
            state: legacyProvider.state,
            google_place_id: legacyProvider.place_id || null,
          },
        });
        legacyResponse.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return legacyResponse;
      }

      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Extract Google Place ID from metadata
    let googlePlaceId = profile.metadata?.google_metadata?.place_id || null;
    let imageUrl: string | null = profile.image_url;

    // If no Google Place ID in business_profiles, check linked olera-providers record.
    // Also lift any cached provider_images so we don't have to re-query.
    if (profile.source_provider_id && (!googlePlaceId || !imageUrl)) {
      const { data: linkedProvider } = await db
        .from("olera-providers")
        .select("provider_id, place_id, provider_images")
        .eq("provider_id", profile.source_provider_id)
        .not("deleted", "is", true)
        .maybeSingle();

      if (!googlePlaceId && linkedProvider?.place_id) {
        googlePlaceId = linkedProvider.place_id;
      }
      if (!imageUrl && linkedProvider?.provider_images) {
        imageUrl = linkedProvider.provider_images;
      }
    }

    // Last resort: Google Places API.
    if (!imageUrl && googlePlaceId) {
      imageUrl = await fetchGooglePlacePhoto(googlePlaceId);
      if (imageUrl && profile.source_provider_id) {
        // Cache for next visitor — fire-and-forget, don't block response.
        db.from("olera-providers")
          .update({ provider_images: imageUrl })
          .eq("provider_id", profile.source_provider_id)
          .then(({ error }) => {
            if (error) console.warn("[info-route] photo write-back failed:", error.message);
          });
      }
    }

    const response = NextResponse.json({
      provider: {
        id: profile.id,
        display_name: profile.display_name,
        slug: profile.slug,
        image_url: imageUrl,
        tagline: null,
        city: profile.city,
        state: profile.state,
        google_place_id: googlePlaceId,
      },
    });
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return response;
  } catch (err) {
    console.error("Provider info GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
