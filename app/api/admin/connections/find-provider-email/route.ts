import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { findEmail, type ProviderContext } from "@/lib/medjobs/outreach-enrichment";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Update enrichment stats in metadata
 * Returns updated stats object (does not write to DB)
 */
function updateEnrichmentStats(
  currentMetadata: unknown,
  update: {
    wasHit: boolean;
    hadEmail: boolean;
    source: string | null;
    adminUserId: string;
  }
) {
  const metadata = (currentMetadata || {}) as Record<string, unknown>;
  const existingStats = (metadata.email_enrichment_stats || {}) as Record<string, unknown>;

  return {
    total_attempts: ((existingStats.total_attempts as number) || 0) + 1,
    cache_hits: ((existingStats.cache_hits as number) || 0) + (update.wasHit ? 1 : 0),
    cache_misses: ((existingStats.cache_misses as number) || 0) + (update.wasHit ? 0 : 1),
    enrichment_successes: ((existingStats.enrichment_successes as number) || 0) + (!update.wasHit && update.hadEmail ? 1 : 0),
    scrape_count: ((existingStats.scrape_count as number) || 0) + (update.source === "scrape" ? 1 : 0),
    perplexity_count: ((existingStats.perplexity_count as number) || 0) + (update.source === "perplexity" ? 1 : 0),
    last_attempted_at: new Date().toISOString(),
    last_attempted_by: `admin:${update.adminUserId}`,
  };
}

/**
 * POST /api/admin/connections/find-provider-email
 *
 * Body: { providerId: string }
 *
 * Finds email address for a provider using web scraping + AI.
 * This is adapted from the MedJobs enrichment system but tailored
 * for the connections page (uses business_profiles instead of student_outreach).
 *
 * Flow:
 * 1. Fetch provider from business_profiles
 * 2. Fall back to olera-providers for website/place_id if needed
 * 3. Call findEmail() which tries:
 *    - Web scraping (free, primary method)
 *    - Perplexity AI (fallback, ~$0.008 per call)
 * 4. Return email + source + all candidates (ranked)
 *
 * Returns:
 * {
 *   email: "contact@provider.com" | null,
 *   source: "scrape" | "perplexity" | null,
 *   candidates: ["contact@provider.com", "info@provider.com"]
 * }
 *
 * Read-only operation - does not modify any data.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as { providerId?: string; forceRefresh?: boolean };
    const providerId = body.providerId?.trim();
    const forceRefresh = body.forceRefresh || false;

    if (!providerId) {
      return NextResponse.json(
        { error: "providerId is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();
    const adminUserId = admin.id;

    // Fetch provider from business_profiles
    const { data: provider, error: providerError } = await db
      .from("business_profiles")
      .select("id, display_name, website, city, state, source_provider_id, metadata")
      .eq("id", providerId)
      .maybeSingle();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Build initial context
    let website = provider.website || null;
    let placeId: string | null = null;
    let city = provider.city || null;
    let state = provider.state || null;

    // Fall back to olera-providers for website/place_id if needed
    if ((!website || !placeId) && provider.source_provider_id) {
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("website, place_id, city, state")
        .eq("provider_id", provider.source_provider_id)
        .maybeSingle();

      if (iosProvider) {
        website = website || (iosProvider.website as string) || null;
        placeId = (iosProvider.place_id as string) || null;
        city = city || (iosProvider.city as string) || null;
        state = state || (iosProvider.state as string) || null;
      }
    }

    const ctx: ProviderContext = {
      name: provider.display_name || null,
      website,
      place_id: placeId,
      city,
      state,
    };

    // Create context hash for cache invalidation
    const contextHash = JSON.stringify({
      name: ctx.name || "",
      website: ctx.website || "",
      place_id: ctx.place_id || "",
      city: ctx.city || "",
      state: ctx.state || "",
    });

    // Check cache (unless force refresh requested)
    if (!forceRefresh) {
      const metadata = (provider.metadata || {}) as Record<string, unknown>;
      const cachedData = metadata.email_enrichment_data as Record<string, unknown> | undefined;

      if (cachedData && cachedData.enriched_at) {
        const enrichedAt = new Date(cachedData.enriched_at as string);
        const ageInDays = (Date.now() - enrichedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Validate cache: must be fresh AND context must match
        const cachedContextHash = cachedData.context_hash as string | undefined;
        const contextMatches = cachedContextHash === contextHash;

        if (ageInDays < 30 && contextMatches) {
          // Update stats for cache hit (fire and forget)
          const updatedStats = updateEnrichmentStats(provider.metadata, {
            wasHit: true,
            hadEmail: !!cachedData.email,
            source: cachedData.source as string | null,
            adminUserId,
          });

          const updatedMetadata = {
            ...metadata,
            email_enrichment_stats: updatedStats,
          };

          db.from("business_profiles")
            .update({ metadata: updatedMetadata })
            .eq("id", providerId)
            .then(({ error }) => {
              if (error) {
                console.error("[find-provider-email] Failed to update cache hit stats:", error);
              }
            });

          return NextResponse.json({
            email: cachedData.email || null,
            source: cachedData.source || null,
            candidates: (cachedData.candidates as string[]) || [],
            cached: true,
            enriched_at: cachedData.enriched_at,
          });
        }
      }
    }

    // Call the email finder (tries scraping first, then Perplexity AI)
    const result = await findEmail(ctx);

    // Update both cache and stats in single metadata write (fire and forget)
    const metadata = (provider.metadata || {}) as Record<string, unknown>;
    const updatedStats = updateEnrichmentStats(provider.metadata, {
      wasHit: false,
      hadEmail: !!result.email,
      source: result.source,
      adminUserId,
    });

    const updatedMetadata = {
      ...metadata,
      email_enrichment_data: {
        email: result.email,
        source: result.source,
        candidates: result.candidates || [],
        enriched_at: new Date().toISOString(),
        context_hash: contextHash,
      },
      email_enrichment_stats: updatedStats,
    };

    // Single write for both cache and stats (fire and forget)
    db.from("business_profiles")
      .update({ metadata: updatedMetadata })
      .eq("id", providerId)
      .then(({ error }) => {
        if (error) {
          console.error("[find-provider-email] Failed to cache result and update stats:", error);
        }
      });

    return NextResponse.json({
      email: result.email,
      source: result.source,
      candidates: result.candidates || [],
      cached: false,
    });
  } catch (e) {
    console.error("[find-provider-email] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Email lookup failed" },
      { status: 500 }
    );
  }
}
