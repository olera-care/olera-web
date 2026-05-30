import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client with service role key.
 * Bypasses RLS — only use server-side.
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/matches/inactive-profiles
 *
 * Fetches profiles by ID, bypassing RLS to retrieve inactive profiles.
 * Only returns profiles that the current user has connections with.
 *
 * Request body: { profileIds: string[] }
 * Returns: { profiles: Profile[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { profileIds } = body as { profileIds: string[] };

    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    // Limit to prevent abuse
    if (profileIds.length > 100) {
      return NextResponse.json({ error: "Too many profile IDs" }, { status: 400 });
    }

    // Get user's provider profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json({ error: "No active profile" }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Verify that the user has connections with these profiles
    const { data: validConnections } = await serviceClient
      .from("connections")
      .select("to_profile_id")
      .eq("from_profile_id", account.active_profile_id)
      .in("to_profile_id", profileIds);

    const validProfileIds = (validConnections || []).map((c) => c.to_profile_id);

    if (validProfileIds.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    // Fetch the profiles using service client (bypasses RLS)
    // Include same fields as main query + is_active for status detection
    // Fields match: app/provider/matches/page.tsx familiesRes query
    const { data: profiles } = await serviceClient
      .from("business_profiles")
      .select("id, display_name, city, state, lat, lng, type, care_types, metadata, image_url, slug, created_at, is_active, phone, email")
      .in("id", validProfileIds);

    return NextResponse.json({ profiles: profiles || [] });
  } catch (err) {
    console.error("Inactive profiles fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
