import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /c/[code]
 *
 * Redirects short claim links to the full claim-campaign URL.
 * Used for contact form outreach where URL length matters.
 *
 * Flow:
 *   1. Look up short code in claim_short_links table
 *   2. If valid and not expired, redirect to /api/claim-campaign?otk=<token>
 *   3. If invalid/expired, redirect to homepage with error
 */

// Use service role for database access (no RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

  // Validate environment
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[claim-short-link] Missing Supabase configuration");
    return NextResponse.redirect(new URL("/?error=config", siteUrl));
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Look up the short link
    const { data: link, error } = await supabase
      .from("claim_short_links")
      .select("token, expires_at, used_at")
      .eq("code", code)
      .single();

    if (error || !link) {
      console.error("[claim-short-link] Link not found:", code);
      return NextResponse.redirect(new URL("/?error=invalid_link", siteUrl));
    }

    // Check if expired
    if (new Date(link.expires_at) < new Date()) {
      console.error("[claim-short-link] Link expired:", code);
      return NextResponse.redirect(new URL("/?error=link_expired", siteUrl));
    }

    // Mark as used (for analytics, don't block if fails)
    if (!link.used_at) {
      await supabase
        .from("claim_short_links")
        .update({ used_at: new Date().toISOString() })
        .eq("code", code);
    }

    // Redirect to claim-campaign with the full token
    const claimUrl = new URL("/api/claim-campaign", siteUrl);
    claimUrl.searchParams.set("otk", link.token);

    return NextResponse.redirect(claimUrl.toString());
  } catch (err) {
    console.error("[claim-short-link] Error:", err);
    return NextResponse.redirect(new URL("/?error=server_error", siteUrl));
  }
}
