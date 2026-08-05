import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { findFaxForProvider, saveFaxResult } from "@/lib/provider-fax-finder";

/**
 * POST /api/admin/provider-outreach/find-fax
 *
 * Scrapes a provider's website for a fax number.
 * Returns the number, source URL, and confidence level.
 *
 * Body: { provider_id: string }
 *
 * Returns:
 * {
 *   fax: "(555) 123-4567" | null,
 *   source_url: "https://example.com/contact" | null,
 *   confidence: "high" | "unsure" | null,
 *   website: "https://example.com"
 * }
 *
 * Also writes result to provider_outreach_tracking (fax_number, fax_source_url,
 * fax_confidence, fax_found_at) so it persists across sessions.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

// ---- Main handler ---------------------------------------------------------

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

    const body = (await request.json()) as { provider_id?: string; manual_fax?: string };
    const providerId = body.provider_id?.trim();
    const manualFax = body.manual_fax?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 },
      );
    }

    const db = getServiceClient();

    // Manual save: admin typed/pasted a fax number directly
    if (manualFax) {
      await saveFaxResult(db, providerId, {
        fax: manualFax,
        source_url: null,
        confidence: "high",
        website: null,
      });
      return NextResponse.json({
        fax: manualFax,
        source_url: null,
        confidence: "high",
        website: null,
      });
    }

    // Fetch provider
    const { data: provider, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, website, place_id, city, state")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (provError) {
      console.error("[find-fax] Provider query error:", provError);
      return NextResponse.json({ error: "Failed to fetch provider" }, { status: 500 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Find fax using shared lib
    const result = await findFaxForProvider({
      provider_id: provider.provider_id,
      provider_name: provider.provider_name,
      website: provider.website,
      place_id: provider.place_id,
      city: provider.city,
      state: provider.state,
    });

    // Save result to tracking table
    await saveFaxResult(db, providerId, result);

    // Return result with error detail if no website
    if (!result.website) {
      return NextResponse.json({
        ...result,
        error_detail: "No website found for this provider",
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[find-fax] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fax lookup failed" },
      { status: 500 },
    );
  }
}
