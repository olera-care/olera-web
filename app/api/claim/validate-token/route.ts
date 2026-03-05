import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***.com";
  const maskedLocal =
    local.length <= 2 ? "*".repeat(local.length) : local[0] + "***" + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

/**
 * POST /api/claim/validate-token
 *
 * Validates a claim token from an email campaign link.
 * If valid, marks the session as pre-verified (skips code entry).
 *
 * Request body: { token: string, claimSession: string }
 * Returns: { valid: true, providerId, emailHint, providerName } or { valid: false, error }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, claimSession } = body;

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token is required." }, { status: 400 });
    }

    if (!claimSession) {
      return NextResponse.json({ valid: false, error: "Claim session is required." }, { status: 400 });
    }

    // Validate the token
    const result = validateClaimToken(token);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    const { providerId, email } = result;

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ valid: false, error: "Server configuration error." }, { status: 500 });
    }

    // Verify provider still exists and email matches
    const { data: provider, error: providerErr } = await db
      .from("olera-providers")
      .select("email, provider_name, slug")
      .eq("provider_id", providerId)
      .single();

    if (providerErr || !provider) {
      return NextResponse.json({ valid: false, error: "Provider not found." }, { status: 404 });
    }

    // Email must still match (in case it was updated since token was generated)
    if (provider.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { valid: false, error: "Provider email has changed. Please request a new link." },
        { status: 400 }
      );
    }

    // Check if already claimed
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("claim_state, account_id")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    if (existingProfile?.claim_state === "claimed" && existingProfile?.account_id) {
      return NextResponse.json(
        { valid: false, error: "This listing has already been claimed.", alreadyClaimed: true },
        { status: 409 }
      );
    }

    // Create a pre-verified record in claim_verification_codes
    // This allows the finalize endpoint to recognize this session as verified
    const { error: insertErr } = await db.from("claim_verification_codes").insert({
      provider_id: providerId,
      claim_session: claimSession,
      code: "TOKEN", // Special marker for token-based verification
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour to complete
      verified_at: new Date().toISOString(), // Pre-verified via token
    });

    if (insertErr) {
      console.error("Insert pre-verified record error:", insertErr);
      return NextResponse.json({ valid: false, error: "Failed to process token." }, { status: 500 });
    }

    return NextResponse.json({
      valid: true,
      providerId,
      emailHint: maskEmail(email),
      providerName: provider.provider_name,
      providerSlug: provider.slug || providerId,
    });
  } catch (err) {
    console.error("Validate token error:", err);
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
  }
}
