import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/connections/create-inquiry
 *
 * Creates an inquiry connection from the current user to a provider.
 * Used when messaging a provider from the Matches page recommendations.
 *
 * Request body:
 * - providerId: string (olera-providers provider_id)
 * - message: string
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { providerId, message } = body as {
      providerId: string;
      message: string;
    };

    if (!providerId || !message?.trim()) {
      return NextResponse.json(
        { error: "Provider ID and message are required" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const db = admin || supabase;

    // Get the user's account and active profile
    const { data: account, error: accountErr } = await db
      .from("accounts")
      .select("id, active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (accountErr || !account?.active_profile_id) {
      return NextResponse.json(
        { error: "No active profile found" },
        { status: 400 }
      );
    }

    const fromProfileId = account.active_profile_id;

    // Get provider info from olera-providers
    const { data: provider, error: providerErr } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state")
      .eq("provider_id", providerId)
      .single();

    if (providerErr || !provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Check if there's an existing business_profile for this provider
    let toProfileId: string | null = null;
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("id")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    if (existingProfile) {
      toProfileId = existingProfile.id;
    } else {
      // Create a placeholder business_profile for the provider
      // This allows the connection to work even if the provider hasn't claimed their profile
      const { data: newProfile, error: createErr } = await db
        .from("business_profiles")
        .insert({
          source_provider_id: providerId,
          slug: `provider-${providerId}`,
          type: "organization",
          display_name: provider.provider_name,
          category: provider.provider_category,
          city: provider.city,
          state: provider.state,
          claim_state: "unclaimed",
          verification_state: "unverified",
          source: "claimed_from_directory",
          is_active: true,
          metadata: {},
        })
        .select("id")
        .single();

      if (createErr) {
        console.error("[create-inquiry] Failed to create provider profile:", createErr);
        return NextResponse.json(
          { error: "Failed to create connection" },
          { status: 500 }
        );
      }

      toProfileId = newProfile.id;
    }

    // Check for existing connection
    const { data: existingConnection } = await db
      .from("connections")
      .select("id, status")
      .eq("from_profile_id", fromProfileId)
      .eq("to_profile_id", toProfileId)
      .eq("type", "inquiry")
      .maybeSingle();

    if (existingConnection) {
      // Connection already exists - just return the existing one
      return NextResponse.json({
        success: true,
        connectionId: existingConnection.id,
        existing: true,
      });
    }

    // Create the connection
    const { data: connection, error: connectionErr } = await db
      .from("connections")
      .insert({
        from_profile_id: fromProfileId,
        to_profile_id: toProfileId,
        type: "inquiry",
        status: "pending",
        message: message.trim(),
        metadata: {
          source: "matches_recommendation",
          provider_id: providerId,
        },
      })
      .select("id")
      .single();

    if (connectionErr) {
      console.error("[create-inquiry] Failed to create connection:", connectionErr);
      return NextResponse.json(
        { error: "Failed to create connection" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connectionId: connection.id,
      existing: false,
    });
  } catch (err) {
    console.error("[create-inquiry] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
