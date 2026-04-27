import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendSlackAlert, slackProviderAction } from "@/lib/slack";
import { sendEmail } from "@/lib/email";
import { claimDecisionEmail } from "@/lib/email-templates";
import { sendLoopsEvent } from "@/lib/loops";

/**
 * PATCH /api/admin/providers/[id]
 *
 * Approve or reject a provider claim.
 * Body: { action: "approve" | "reject" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch profile first (needed for notifications and audit)
    const { data: profile, error: fetchError } = await db
      .from("business_profiles")
      .select("id, display_name, claim_state, account_id, slug")
      .eq("id", id)
      .single();

    if (fetchError || !profile) {
      console.error("Failed to fetch provider:", fetchError);
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Approve: update claim_state to "claimed"
      const { error: updateError } = await db
        .from("business_profiles")
        .update({ claim_state: "claimed", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        console.error("Failed to approve provider:", updateError);
        return NextResponse.json({ error: "Failed to approve provider" }, { status: 500 });
      }

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "approve_provider",
        targetType: "business_profile",
        targetId: id,
        details: {
          provider_name: profile.display_name,
          new_state: "claimed",
        },
      });
    } else {
      // Reject: delete the profile to free up the listing
      const { error: deleteError } = await db
        .from("business_profiles")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Failed to reject provider:", deleteError);
        return NextResponse.json({ error: "Failed to reject provider" }, { status: 500 });
      }

      // Clear active_profile_id if this was the account's active profile
      if (profile.account_id) {
        await db
          .from("accounts")
          .update({ active_profile_id: null })
          .eq("id", profile.account_id)
          .eq("active_profile_id", id);
      }

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "reject_provider",
        targetType: "business_profile",
        targetId: id,
        details: {
          provider_name: profile.display_name,
          action: "deleted_to_free_listing",
        },
      });
    }

    // Slack alert (fire-and-forget)
    try {
      const alert = slackProviderAction({
        providerName: profile?.display_name || id,
        action: action === "approve" ? "approved" : "rejected",
        adminEmail: user.email || "admin",
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch {
      // Non-blocking
    }

    // Email + Loops notification to provider (fire-and-forget)
    try {
      if (profile?.account_id) {
        // account_id references accounts table, not auth.users directly
        const { data: account } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", profile.account_id)
          .single();
        if (account?.user_id) {
          const { data: authUser } = await db.auth.admin.getUserById(account.user_id);
          const providerEmail = authUser?.user?.email;
          if (providerEmail) {
            const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}/provider/${profile.slug || id}`;
            await sendEmail({
              to: providerEmail,
              subject: action === "approve"
                ? "Your Olera listing is live!"
                : "Your Olera claim needs attention",
              html: claimDecisionEmail({
                providerName: profile.display_name || "Your organization",
                approved: action === "approve",
                listingUrl,
              }),
              emailType: "claim_decision",
              recipientType: "provider",
              providerId: id,
            });
            await sendLoopsEvent({
              email: providerEmail,
              eventName: action === "approve" ? "provider_approved" : "provider_rejected",
              audience: "provider",
              eventProperties: {
                providerName: profile.display_name || "",
              },
            });
          }
        }
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Admin provider action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
