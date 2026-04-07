import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/medjobs/link-provider-profile
 *
 * Links a business_profile to the authenticated user's account.
 * Used after a provider clicks a magic link and signs in.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Get or create the user's account
    let { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      // Create account if it doesn't exist
      const { data: newAccount, error: createError } = await admin
        .from("accounts")
        .insert({
          user_id: user.id,
          display_name: user.email?.split("@")[0] || "Provider",
        })
        .select("id")
        .single();

      if (createError || !newAccount) {
        console.error("[medjobs/link-provider-profile] account creation error:", createError);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }

      account = newAccount;
    }

    // Fetch the business_profile
    const { data: profile, error: profileError } = await admin
      .from("business_profiles")
      .select("id, account_id, email")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if profile is already linked to a different account
    if (profile.account_id && profile.account_id !== account.id) {
      return NextResponse.json({ error: "This profile is already linked to another account" }, { status: 409 });
    }

    // Verify email matches
    if (profile.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Email mismatch. Please sign in with the correct email." }, { status: 403 });
    }

    // Link the profile to the account
    if (!profile.account_id) {
      const { error: updateError } = await admin
        .from("business_profiles")
        .update({
          account_id: account.id,
          claim_state: "claimed",
        })
        .eq("id", profileId);

      if (updateError) {
        console.error("[medjobs/link-provider-profile] profile update error:", updateError);
        return NextResponse.json({ error: "Failed to link profile" }, { status: 500 });
      }
    }

    // Set this as the active profile if they don't have one
    const { data: currentAccount } = await admin
      .from("accounts")
      .select("active_profile_id")
      .eq("id", account.id)
      .single();

    if (!currentAccount?.active_profile_id) {
      await admin
        .from("accounts")
        .update({ active_profile_id: profileId })
        .eq("id", account.id);
    }

    return NextResponse.json({
      success: true,
      profileId,
      accountId: account.id,
    });
  } catch (err) {
    console.error("[medjobs/link-provider-profile] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
