import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { findEmail, type ProviderContext } from "@/lib/medjobs/outreach-enrichment";

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

    const body = (await request.json()) as { providerId?: string };
    const providerId = body.providerId?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "providerId is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch provider from business_profiles
    const { data: provider, error: providerError } = await db
      .from("business_profiles")
      .select("id, display_name, website, city, state, source_provider_id")
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

    // Call the email finder (tries scraping first, then Perplexity AI)
    const result = await findEmail(ctx);

    return NextResponse.json({
      email: result.email,
      source: result.source,
      candidates: result.candidates || [],
    });
  } catch (e) {
    console.error("[find-provider-email] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Email lookup failed" },
      { status: 500 }
    );
  }
}
