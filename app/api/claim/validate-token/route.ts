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
    // Token providerId may be a slug (from notification emails) or a UUID (from campaign emails)
    // Check olera-providers first, then fall back to business_profiles
    let providerName: string | null = null;
    let providerSlug: string | null = null;
    let providerEmail: string | null = null;
    let isBusinessProfile = false;

    // Try olera-providers by provider_id
    const { data: oleraProvider } = await db
      .from("olera-providers")
      .select("email, provider_name, slug")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (oleraProvider) {
      providerName = oleraProvider.provider_name;
      providerSlug = oleraProvider.slug || providerId;
      providerEmail = oleraProvider.email;
    } else {
      // Try olera-providers by slug
      const { data: oleraBySlug } = await db
        .from("olera-providers")
        .select("email, provider_name, slug")
        .eq("slug", providerId)
        .maybeSingle();

      if (oleraBySlug) {
        providerName = oleraBySlug.provider_name;
        providerSlug = oleraBySlug.slug || providerId;
        providerEmail = oleraBySlug.email;
      } else {
        // Try business_profiles by slug (BP-only providers)
        const { data: bp } = await db
          .from("business_profiles")
          .select("display_name, slug, email")
          .eq("slug", providerId)
          .in("type", ["organization", "caregiver"])
          .maybeSingle();

        if (bp) {
          providerName = bp.display_name;
          providerSlug = bp.slug || providerId;
          providerEmail = bp.email;
          isBusinessProfile = true;
        }
      }
    }

    if (!providerName) {
      return NextResponse.json({ valid: false, error: "Provider not found." }, { status: 404 });
    }

    // Email must still match (in case it was updated since token was generated)
    // For BP-only providers, the email in the token is what we sent to — trust it
    if (providerEmail && providerEmail.toLowerCase() !== email.toLowerCase() && !isBusinessProfile) {
      return NextResponse.json(
        { valid: false, error: "Provider email has changed. Please request a new link." },
        { status: 400 }
      );
    }

    // Check if already claimed
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("claim_state, account_id")
      .or(`source_provider_id.eq.${providerId},slug.eq.${providerId}`)
      .maybeSingle();

    // For already-claimed listings, still return valid — the owner clicking their
    // own notification email is the expected case. The one-click flow on the client
    // will establish their session and redirect to the destination.
    const alreadyClaimed = existingProfile?.claim_state === "claimed" && !!existingProfile?.account_id;

    // Create a pre-verified record in claim_verification_codes
    // This allows the finalize endpoint to recognize this session as verified
    try {
      await db.from("claim_verification_codes").insert({
        provider_id: providerId,
        claim_session: claimSession,
        code: "TOKEN",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        verified_at: new Date().toISOString(),
      });
    } catch {
      // May fail if duplicate — that's fine
    }

    return NextResponse.json({
      valid: true,
      providerId,
      email,  // Full email for auto-sign-in flow
      emailHint: maskEmail(email),  // Masked for display
      providerName: providerName,
      providerSlug: providerSlug || providerId,
      alreadyClaimed,
    });
  } catch (err) {
    console.error("Validate token error:", err);
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
  }
}
