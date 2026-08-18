import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { generateClaimToken } from "@/lib/claim-tokens";
import { randomBytes } from "crypto";

/**
 * POST /api/admin/provider-outreach/generate-claim-url
 *
 * Generate a short claim URL for a provider.
 * Used by the contact form workflow to include a trackable one-click claim link.
 *
 * Creates a short link (e.g., https://olera.care/c/Xk9mP2nQ) that redirects
 * to the full claim-campaign URL. This keeps the message under contact form
 * character limits.
 *
 * Request body:
 *   - provider_id: string (required)
 *
 * Returns:
 *   - claim_url: string - the short link URL (~35 chars instead of ~260)
 *   - provider_name: string
 *   - city: string | null
 *   - category: string | null
 */

// Token expiry: 15 days (same as claim tokens)
const TOKEN_EXPIRY_HOURS = parseInt(process.env.CLAIM_TOKEN_EXPIRY_HOURS || "360", 10);

// Generate a random 8-character code (alphanumeric)
function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

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

    // Generate the claim token
    const token = generateClaimToken(provider.provider_id, provider.email);

    // Generate a unique short code (retry if collision)
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      shortCode = generateShortCode();

      // Try to insert the short link
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      const { error: insertError } = await db
        .from("claim_short_links")
        .insert({
          code: shortCode,
          token,
          provider_id: provider.provider_id,
          expires_at: expiresAt.toISOString(),
        });

      if (!insertError) {
        // Success - build the short URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
        const shortUrl = `${siteUrl}/c/${shortCode}`;

        return NextResponse.json({
          claim_url: shortUrl,
          provider_name: provider.provider_name,
          city: provider.city,
          state: provider.state,
          category: provider.provider_category,
        });
      }

      // Check if it was a unique constraint violation (code collision)
      if (insertError.code === "23505") {
        attempts++;
        continue;
      }

      // Other error - fail
      console.error("[generate-claim-url] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to create short link" }, { status: 500 });
    }

    // Exhausted retries
    console.error("[generate-claim-url] Failed to generate unique code after", maxAttempts, "attempts");
    return NextResponse.json({ error: "Failed to create short link" }, { status: 500 });
  } catch (err) {
    console.error("[generate-claim-url] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
