import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { generateClaimUrl } from "@/lib/claim-tokens";

/**
 * POST /api/admin/provider-outreach/generate-claim-url
 *
 * Generate a magic claim URL for a provider.
 * Used by the contact form workflow to include a trackable one-click claim link.
 *
 * Request body:
 *   - provider_id: string (required)
 *
 * Returns:
 *   - claim_url: string - the magic link URL
 *   - provider_name: string
 *   - city: string | null
 *   - category: string | null
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_id } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get provider data
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email, city, state, provider_category")
      .eq("provider_id", provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (!provider.email) {
      return NextResponse.json({ error: "Provider has no email on file" }, { status: 400 });
    }

    if (!provider.slug) {
      return NextResponse.json({ error: "Provider has no public page" }, { status: 400 });
    }

    // Generate the magic claim URL
    const claimUrl = generateClaimUrl(
      provider.provider_id,
      provider.slug,
      provider.email
    );

    return NextResponse.json({
      claim_url: claimUrl,
      provider_name: provider.provider_name,
      city: provider.city,
      state: provider.state,
      category: provider.provider_category,
    });
  } catch (err) {
    console.error("[generate-claim-url] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
