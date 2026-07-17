import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { findEmail, type ProviderContext } from "@/lib/medjobs/outreach-enrichment";

/**
 * POST /api/admin/provider-outreach/find-email
 *
 * Body: { provider_id: string, forceRefresh?: boolean }
 *
 * Finds email address for an unclaimed provider (olera-providers).
 * Uses web scraping + Perplexity AI fallback.
 *
 * Checks multiple sources in order:
 * 1. olera-providers.email (existing email on file)
 * 2. business_profiles.email (linked profile may have email)
 * 3. business_profiles.metadata.email_enrichment_data (cached from Connections page)
 * 4. Fresh enrichment via web scraping + Perplexity AI
 *
 * Caches results in business_profiles.metadata so both Provider Outreach and
 * Connections pages share the same cache (saves ~$0.008/call to Perplexity).
 *
 * Returns:
 * {
 *   email: "contact@provider.com" | null,
 *   source: "scrape" | "perplexity" | "existing" | null,
 *   candidates: ["contact@provider.com", "info@provider.com"],
 *   candidatesWithUrls: [{ email: "...", url: "..." }],
 *   cached: boolean
 * }
 *
 * Read-only for olera-providers - only caches to business_profiles.metadata.
 * The caller is responsible for saving the email if desired.
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

    const body = (await request.json()) as { provider_id?: string; forceRefresh?: boolean };
    const providerId = body.provider_id?.trim();
    const forceRefresh = body.forceRefresh || false;

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch provider from olera-providers
    const { data: provider, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, website, place_id, city, state, email")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (provError) {
      console.error("[provider-outreach/find-email] Provider query error:", provError);
      return NextResponse.json({ error: "Failed to fetch provider" }, { status: 500 });
    }

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Check 1: If olera-providers already has an email, return it immediately
    if (provider.email) {
      return NextResponse.json({
        email: provider.email,
        source: "existing",
        candidates: [provider.email],
        candidatesWithUrls: [{ email: provider.email, url: null }],
        cached: true,
      });
    }

    // Check 2: Look for linked business_profile (may have email or cached enrichment)
    const { data: linkedProfile } = await db
      .from("business_profiles")
      .select("id, email, metadata")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    // If linked profile has an email, return it
    if (linkedProfile?.email) {
      return NextResponse.json({
        email: linkedProfile.email,
        source: "existing",
        candidates: [linkedProfile.email],
        candidatesWithUrls: [{ email: linkedProfile.email, url: null }],
        cached: true,
      });
    }

    // Build context for email lookup (needed for cache validation and enrichment)
    const ctx: ProviderContext = {
      name: provider.provider_name || null,
      website: provider.website || null,
      place_id: provider.place_id || null,
      city: provider.city || null,
      state: provider.state || null,
    };

    // Validate provider has minimal data for enrichment
    if (!ctx.name && !ctx.website && !ctx.place_id) {
      return NextResponse.json({
        error: "Provider has insufficient data for email lookup (no name, website, or place_id)",
        email: null,
        source: null,
        candidates: [],
      });
    }

    // Create context hash for cache validation (same as Connections page)
    const contextHash = JSON.stringify({
      name: ctx.name || "",
      website: ctx.website || "",
      place_id: ctx.place_id || "",
      city: ctx.city || "",
      state: ctx.state || "",
    });

    // Check 3: Look for cached enrichment data in business_profiles.metadata
    if (linkedProfile && !forceRefresh) {
      const metadata = (linkedProfile.metadata || {}) as Record<string, unknown>;
      const cachedData = metadata.email_enrichment_data as Record<string, unknown> | undefined;

      if (cachedData && cachedData.enriched_at) {
        const enrichedAt = new Date(cachedData.enriched_at as string);
        const timestamp = enrichedAt.getTime();

        // Validate cache: must be fresh (< 30 days) AND context must match
        if (!isNaN(timestamp)) {
          const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          const cachedContextHash = cachedData.context_hash as string | undefined;
          const contextMatches = cachedContextHash === contextHash;

          if (ageInDays < 30 && ageInDays >= 0 && contextMatches) {
            console.log(`[provider-outreach/find-email] Cache hit for ${providerId} (${Math.round(ageInDays)} days old)`);
            return NextResponse.json({
              email: cachedData.email || null,
              source: cachedData.source || null,
              foundUrl: cachedData.foundUrl || null,
              candidates: (cachedData.candidates as string[]) || [],
              candidatesWithUrls: cachedData.candidatesWithUrls || [],
              cached: true,
              enriched_at: cachedData.enriched_at,
            });
          }
        }
      }
    }

    // Check 4: Fresh enrichment via web scraping + Perplexity AI
    let result;
    try {
      result = await findEmail(ctx);
    } catch (enrichmentError) {
      console.error("[provider-outreach/find-email] Enrichment failed:", enrichmentError);
      return NextResponse.json({
        error: "Email enrichment failed. The provider's website may be inaccessible.",
        email: null,
        source: null,
        candidates: [],
      });
    }

    // Cache the result in business_profiles.metadata (if linked profile exists)
    // This allows Connections page to reuse the result
    if (linkedProfile) {
      const metadata = (linkedProfile.metadata || {}) as Record<string, unknown>;
      const updatedMetadata = {
        ...metadata,
        email_enrichment_data: {
          email: result.email,
          source: result.source,
          foundUrl: result.foundUrl || null,
          candidates: result.candidates || [],
          candidatesWithUrls: result.candidatesWithUrls || [],
          enriched_at: new Date().toISOString(),
          context_hash: contextHash,
        },
      };

      // Fire and forget - don't block response on cache write
      db.from("business_profiles")
        .update({ metadata: updatedMetadata })
        .eq("id", linkedProfile.id)
        .then(({ error }) => {
          if (error) {
            console.error("[provider-outreach/find-email] Failed to cache result:", error);
          } else {
            console.log(`[provider-outreach/find-email] Cached enrichment for ${providerId}`);
          }
        });
    }

    return NextResponse.json({
      email: result.email,
      source: result.source,
      foundUrl: result.foundUrl || null,
      candidates: result.candidates || [],
      candidatesWithUrls: result.candidatesWithUrls || [],
      cached: false,
    });
  } catch (e) {
    console.error("[provider-outreach/find-email] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Email lookup failed" },
      { status: 500 }
    );
  }
}
