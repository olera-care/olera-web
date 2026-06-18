import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * POST /api/activity/track-lead-opened
 *
 * Server-side endpoint to track lead_opened events for authenticated providers.
 * Used by the magic-link handler when providers click email links that bypass
 * /api/claim-lead (e.g., stale_conversation, unread_reminder emails).
 *
 * This endpoint:
 * 1. Gets the authenticated user's provider profile
 * 2. Tracks the lead_opened event with the correct provider_id
 *
 * Body:
 * - connection_id: string | null - The connection ID from URL params
 * - source: string - Where this came from (e.g., "magic_link")
 * - destination: string - The intended destination URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connection_id, source, destination } = body;

    // Require connection_id - without it, the event becomes an "orphan" that
    // can't be matched to a specific lead, causing providers to appear stuck
    if (!connection_id) {
      return NextResponse.json({ tracked: false, reason: "no_connection_id" });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the user's account and active provider profile
    const { data: account } = await supabase
      .from("accounts")
      .select("id, active_profile_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({ error: "No account found" }, { status: 400 });
    }

    // Get the provider profile - prefer active_profile_id, fall back to any provider/org profile
    let profile: { id: string; slug: string | null; source_provider_id: string | null } | null = null;

    if (account.active_profile_id) {
      const { data } = await supabase
        .from("business_profiles")
        .select("id, slug, source_provider_id, type")
        .eq("id", account.active_profile_id)
        .in("type", ["organization", "caregiver"])
        .maybeSingle();
      profile = data;
    }

    // Fallback: get any provider profile for this account
    if (!profile) {
      const { data } = await supabase
        .from("business_profiles")
        .select("id, slug, source_provider_id, type")
        .eq("account_id", account.id)
        .in("type", ["organization", "caregiver"])
        .limit(1)
        .maybeSingle();
      profile = data;
    }

    if (!profile) {
      // User has no provider profile - they might be a family
      // This is not an error, just nothing to track
      return NextResponse.json({ tracked: false, reason: "no_provider_profile" });
    }

    // Determine provider key for tracking
    const providerKey = profile.slug || profile.source_provider_id || profile.id;

    // Track the event using service client (bypasses RLS)
    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceUrl || !serviceKey) {
      console.error("[track-lead-opened] Missing service credentials");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const admin = createServiceClient(serviceUrl, serviceKey);

    const { error: insertError } = await admin.from("provider_activity").insert({
      provider_id: providerKey,
      profile_id: profile.id,
      event_type: "lead_opened",
      metadata: {
        connection_id,
        lead_id: connection_id,
        source: source || "magic_link",
        destination: destination || null,
      },
    });

    if (insertError) {
      console.error("[track-lead-opened] Insert failed:", insertError);
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
    }

    console.log("[track-lead-opened] Tracked lead_opened for provider:", providerKey, "connection:", connection_id);

    return NextResponse.json({ tracked: true, provider_id: providerKey });
  } catch (err) {
    console.error("[track-lead-opened] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
