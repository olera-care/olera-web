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
      .select("id, account_id, source_provider_id, claim_state, metadata")
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

    // v10 Phase 4+5 Bullet 2 (2026-06-04): pilot-active providers can't
    // delete their public listing — students invited to interview need
    // to be able to research the agency; families clicking through
    // Olera need to find them; the pilot ecosystem assumes the listing
    // is part of the provider's public face (master plan § P1.E.5).
    // To delete, end the pilot first via email to logan@olera.care.
    const meta = (profile.metadata as Record<string, unknown> | null) ?? {};
    const pilotThroughRaw = meta.pilot_active_through;
    if (typeof pilotThroughRaw === "string") {
      const pilotThroughMs = new Date(pilotThroughRaw).getTime();
      if (Number.isFinite(pilotThroughMs) && pilotThroughMs > Date.now()) {
        return NextResponse.json(
          {
            error:
              "Your public listing is required while your MedJobs pilot is active. To delete, please email logan@olera.care to end the pilot first.",
            pilotActive: true,
            pilotActiveThrough: pilotThroughRaw,
          },
          { status: 409 }
        );
      }
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

    // Soft-delete connections instead of hard-deleting
    // This preserves connection history for the other party (e.g., provider's outreach page)
    const { data: existingConnections } = await admin
      .from("connections")
      .select("id, metadata")
      .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);

    if (existingConnections && existingConnections.length > 0) {
      for (const conn of existingConnections) {
        const existingMeta = (conn.metadata as Record<string, unknown>) || {};
        await admin
          .from("connections")
          .update({
            metadata: {
              ...existingMeta,
              profile_deleted: true,
              profile_deleted_at: new Date().toISOString(),
              deleted_profile_id: profileId,
            },
          })
          .eq("id", conn.id);
      }
    }

    // Handle seeded/claimed profiles: revert to unclaimed instead of hard-deleting
    if (profile.source_provider_id) {
      // Revert to unclaimed (keep profile for directory, just remove ownership)
      const { error: unclaimError } = await admin
        .from("business_profiles")
        .update({
          account_id: null,
          claim_state: "unclaimed",
          is_active: false, // Hide from RLS until reclaimed
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
      // User-created profile: soft delete (set is_active = false, detach from account)
      // This preserves the profile data for connection history
      const { error: softDeleteError } = await admin
        .from("business_profiles")
        .update({
          is_active: false,
          account_id: null, // Detach from account (consistent with seeded profiles)
          metadata: {
            ...(profile as { metadata?: Record<string, unknown> }).metadata,
            deleted_at: new Date().toISOString(),
            deleted_by_user: true,
            original_account_id: account.id, // Preserve for audit trail
          },
        })
        .eq("id", profileId);

      if (softDeleteError) {
        console.error("[delete-profile] soft delete failed:", softDeleteError);
        return NextResponse.json(
          { error: softDeleteError.message },
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
        .eq("is_active", true) // Exclude soft-deleted profiles
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
