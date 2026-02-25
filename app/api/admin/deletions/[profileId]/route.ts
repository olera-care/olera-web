import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * PATCH /api/admin/deletions/[profileId]
 *
 * Admin actions on deletion requests:
 * - approve: soft-delete the olera-providers listing + mark profile
 * - deny: clear deletion_requested flags, provider returns to normal
 * - restore: un-soft-delete provider + reset profile claim
 * - purge: permanently delete provider from olera-providers
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { profileId } = await params;
    const { action } = (await request.json()) as { action: string };
    const db = getServiceClient();
    const now = new Date().toISOString();

    if (action === "approve") {
      // Fetch the business profile
      const { data: profile, error: profileError } = await db
        .from("business_profiles")
        .select("id, display_name, source_provider_id, deletion_requested")
        .eq("id", profileId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      if (!profile.deletion_requested) {
        return NextResponse.json({ error: "No pending deletion request" }, { status: 400 });
      }

      // Step 1: Soft-delete the olera-providers listing (if linked)
      if (profile.source_provider_id) {
        const { error: softDeleteError } = await db
          .from("olera-providers")
          .update({ deleted: true, deleted_at: now })
          .eq("provider_id", profile.source_provider_id);

        if (softDeleteError) {
          console.error("[approve-deletion] soft-delete failed:", softDeleteError);
          // Continue — the provider may not exist in olera-providers (user-created listing)
        }
      }

      // Step 2: Update business_profiles
      const { error: updateError } = await db
        .from("business_profiles")
        .update({
          deletion_requested: false,
          deletion_approved_at: now,
          claim_state: "rejected",
        })
        .eq("id", profileId);

      if (updateError) {
        console.error("[approve-deletion] profile update failed:", updateError);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }

      // Step 3: Audit log
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "approve_deletion",
        targetType: "business_profile",
        targetId: profileId,
        details: {
          provider_name: profile.display_name,
          source_provider_id: profile.source_provider_id,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "deny") {
      // Fetch profile to verify it has a pending request
      const { data: profile, error: profileError } = await db
        .from("business_profiles")
        .select("id, display_name, deletion_requested")
        .eq("id", profileId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      if (!profile.deletion_requested) {
        return NextResponse.json({ error: "No pending deletion request" }, { status: 400 });
      }

      // Clear deletion request flags
      const { error: updateError } = await db
        .from("business_profiles")
        .update({
          deletion_requested: false,
          deletion_requested_at: null,
        })
        .eq("id", profileId);

      if (updateError) {
        console.error("[deny-deletion] update failed:", updateError);
        return NextResponse.json({ error: "Failed to deny request" }, { status: 500 });
      }

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "deny_deletion",
        targetType: "business_profile",
        targetId: profileId,
        details: { provider_name: profile.display_name },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "restore") {
      // Restore uses providerId (from olera-providers) passed as profileId param
      // First check if there's a linked business_profile
      const { data: profile } = await db
        .from("business_profiles")
        .select("id, display_name, source_provider_id")
        .eq("source_provider_id", profileId)
        .maybeSingle();

      // Un-soft-delete from olera-providers
      const { error: restoreError } = await db
        .from("olera-providers")
        .update({ deleted: false, deleted_at: null })
        .eq("provider_id", profileId);

      if (restoreError) {
        console.error("[restore] failed:", restoreError);
        return NextResponse.json({ error: "Failed to restore provider" }, { status: 500 });
      }

      // Reset business_profile if linked
      if (profile) {
        await db
          .from("business_profiles")
          .update({
            claim_state: "claimed",
            deletion_approved_at: null,
          })
          .eq("id", profile.id);
      }

      // Get provider name for audit
      const { data: provider } = await db
        .from("olera-providers")
        .select("provider_name")
        .eq("provider_id", profileId)
        .single();

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "restore_provider",
        targetType: "directory_provider",
        targetId: profileId,
        details: {
          provider_name: provider?.provider_name ?? profile?.display_name ?? "Unknown",
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "purge") {
      // Get provider info before deleting for audit
      const { data: provider } = await db
        .from("olera-providers")
        .select("provider_name")
        .eq("provider_id", profileId)
        .single();

      // Permanently delete from olera-providers
      const { error: purgeError } = await db
        .from("olera-providers")
        .delete()
        .eq("provider_id", profileId);

      if (purgeError) {
        console.error("[purge] failed:", purgeError);
        return NextResponse.json({ error: "Failed to purge provider" }, { status: 500 });
      }

      // Unlink any business_profile that referenced this provider
      const { data: linkedProfile } = await db
        .from("business_profiles")
        .select("id")
        .eq("source_provider_id", profileId)
        .maybeSingle();

      if (linkedProfile) {
        await db
          .from("business_profiles")
          .update({
            source_provider_id: null,
            claim_state: "unclaimed",
            deletion_approved_at: null,
          })
          .eq("id", linkedProfile.id);
      }

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "purge_provider",
        targetType: "directory_provider",
        targetId: profileId,
        details: {
          provider_name: provider?.provider_name ?? "Unknown",
          permanent: true,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Admin deletion action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
