import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

/**
 * DELETE /api/auth/delete-profile
 *
 * Removes a single profile from the caller's account.
 * - Verifies profile ownership
 * - Blocks deletion of the user's last profile (use delete-account instead)
 * - Claimed/seeded profiles are reverted to unclaimed rather than hard-deleted
 * - Auto-switches active_profile_id to a remaining profile
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { profileId } = (await request.json()) as { profileId?: string };
    if (!profileId) {
      return NextResponse.json(
        { error: "Missing profileId" },
        { status: 400 }
      );
    }

    const admin = getServiceClient();

    // Get caller's account
    const { data: account, error: accountError } = await admin
      .from("accounts")
      .select("id, active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 400 }
      );
    }

    // Verify profile belongs to this account
    const { data: profile, error: profileError } = await admin
      .from("business_profiles")
      .select("id, account_id, source_provider_id, claim_state")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.account_id !== account.id) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Count remaining profiles
    const { count } = await admin
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id);

    if (count !== null && count <= 1) {
      return NextResponse.json(
        {
          error:
            "This is your only profile. To remove it, use 'Delete account' instead.",
          isLastProfile: true,
        },
        { status: 409 }
      );
    }

    const wasActive = account.active_profile_id === profileId;

    // Handle seeded/claimed profiles: revert to unclaimed instead of hard-deleting
    if (profile.source_provider_id) {
      // Manually delete connections (UPDATE won't trigger ON DELETE CASCADE)
      await admin
        .from("connections")
        .delete()
        .or(
          `from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`
        );

      // Revert to unclaimed
      const { error: unclaimError } = await admin
        .from("business_profiles")
        .update({
          account_id: null,
          claim_state: "unclaimed",
        })
        .eq("id", profileId);

      if (unclaimError) {
        console.error("[delete-profile] unclaim failed:", unclaimError);
        return NextResponse.json(
          { error: unclaimError.message },
          { status: 500 }
        );
      }
    } else {
      // User-created profile: hard delete (connections cascade automatically)
      const { error: deleteError } = await admin
        .from("business_profiles")
        .delete()
        .eq("id", profileId);

      if (deleteError) {
        console.error("[delete-profile] delete failed:", deleteError);
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }
    }

    // Switch active profile if the deleted one was active
    let newActiveProfileId: string | null = null;

    if (wasActive) {
      const { data: remaining } = await admin
        .from("business_profiles")
        .select("id")
        .eq("account_id", account.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (remaining && remaining.length > 0) {
        newActiveProfileId = remaining[0].id;
        await admin
          .from("accounts")
          .update({ active_profile_id: newActiveProfileId })
          .eq("id", account.id);
      }
    }

    return NextResponse.json({ success: true, newActiveProfileId });
  } catch (err) {
    console.error("[delete-profile] error:", err);
    return NextResponse.json(
      { error: "Failed to remove profile" },
      { status: 500 }
    );
  }
}
