import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { sendLoopsEventBoth } from "@/lib/loops";

export async function DELETE() {
  try {
    // Get authenticated user from cookies
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

    const admin = getServiceClient();

    // Get account ID first
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      // No account found — just delete auth user
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error("[olera] deleteUser failed:", deleteError);
      }
      return NextResponse.json({ success: true });
    }

    // Get profiles with metadata to extract enrichment session IDs and check for seeded profiles
    const { data: profiles } = await admin
      .from("business_profiles")
      .select("id, metadata, source_provider_id")
      .eq("account_id", account.id);

    const profileIds = (profiles || []).map((p: { id: string }) => p.id);

    // Extract enrichment session IDs from profile metadata
    const sessionIds = (profiles || [])
      .map((p: { metadata?: { enrichment_session_id?: string } }) =>
        p.metadata?.enrichment_session_id
      )
      .filter((id): id is string => !!id);

    if (profileIds.length > 0) {
      // Soft-delete connections instead of hard-deleting
      // This preserves connection history for the other party
      for (const profileId of profileIds) {
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
                  account_deleted: true,
                },
              })
              .eq("id", conn.id);
          }
        }
      }

      // Soft-delete profiles: set is_active = false and detach from account
      // Detaching (account_id = null) prevents CASCADE delete when account is removed
      // For seeded/claimed profiles, reset claim_state to allow reclaiming
      for (const profileId of profileIds) {
        const profileData = profiles?.find((p: { id: string }) => p.id === profileId) as {
          id: string;
          metadata?: Record<string, unknown>;
          source_provider_id?: string;
        } | undefined;

        const updateData: Record<string, unknown> = {
          is_active: false,
          account_id: null,
          metadata: {
            ...(profileData?.metadata || {}),
            deleted_at: new Date().toISOString(),
            deleted_by_account_deletion: true,
            original_account_id: account.id,
          },
        };

        // For seeded profiles, reset claim_state to allow reclaiming
        if (profileData?.source_provider_id) {
          updateData.claim_state = "unclaimed";
        }

        await admin
          .from("business_profiles")
          .update(updateData)
          .eq("id", profileId);
      }

      // Delete provider_activity records by profile_id (for non-anonymous events)
      await admin
        .from("provider_activity")
        .delete()
        .in("profile_id", profileIds);

      // Delete seeker_activity records
      await admin
        .from("seeker_activity")
        .delete()
        .in("profile_id", profileIds);
    }

    // Delete provider_activity records by session_id (for anonymous enrichment events)
    // These events have profile_id=null but can be linked via session_id in metadata
    if (sessionIds.length > 0) {
      for (const sessionId of sessionIds) {
        await admin
          .from("provider_activity")
          .delete()
          .filter("metadata->>session_id", "eq", sessionId);
      }
    }

    // Business profiles are already soft-deleted and detached above
    // No need to hard-delete them - they're preserved for connection history

    // Delete memberships
    await admin
      .from("memberships")
      .delete()
      .eq("account_id", account.id);

    // Delete account
    await admin.from("accounts").delete().eq("id", account.id);

    // Delete auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[olera] deleteUser failed:", deleteError);
      // Non-fatal — data is already cleaned up
    }

    // Loops: account deleted for suppression/cleanup (fire-and-forget)
    try {
      await sendLoopsEventBoth({
        email: user.email || "",
        eventName: "account_deleted",
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[olera] delete-account error:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
