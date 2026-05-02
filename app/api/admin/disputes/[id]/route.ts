import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendSlackAlert } from "@/lib/slack";

/**
 * PATCH /api/admin/disputes/[id]
 *
 * Resolve or dismiss a dispute.
 * Body: { action: "resolve" | "dismiss" }
 *
 * - resolve: Unclaims the provider and marks dispute as resolved
 * - dismiss: Marks dispute as rejected, keeps current claimer
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
    const { action } = body;

    if (!action || !["resolve", "dismiss"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'resolve' or 'dismiss'." }, { status: 400 });
    }

    const db = getServiceClient();

    // Get the dispute
    const { data: dispute, error: fetchError } = await db
      .from("disputes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !dispute) {
      console.error("Failed to fetch dispute:", fetchError);
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== "pending") {
      return NextResponse.json({ error: "Dispute has already been processed" }, { status: 400 });
    }

    if (action === "resolve") {
      // 1. Get the business profile
      const { data: profile, error: profileError } = await db
        .from("business_profiles")
        .select("id, account_id, display_name, metadata")
        .eq("id", dispute.provider_id)
        .single();

      if (profileError) {
        console.error("Failed to fetch profile:", profileError);
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }

      // 2. If the provider is claimed, unclaim it
      if (profile?.account_id) {
        // Clear active_profile_id from accounts if this was active
        await db
          .from("accounts")
          .update({ active_profile_id: null, updated_at: new Date().toISOString() })
          .eq("active_profile_id", dispute.provider_id);

        // Reset claim fields and clear verification metadata
        const currentMetadata = (profile.metadata as Record<string, unknown>) || {};
        const cleanedMetadata = { ...currentMetadata };
        delete cleanedMetadata.verification_submission;
        delete cleanedMetadata.verification_attempts;
        delete cleanedMetadata.verification_attempt;
        delete cleanedMetadata.email_otp_attempt;
        delete cleanedMetadata.badge_approved;
        delete cleanedMetadata.badge_approved_at;
        delete cleanedMetadata.badge_rejected;
        delete cleanedMetadata.badge_rejected_at;
        delete cleanedMetadata.verified_at;
        delete cleanedMetadata.verification_method;
        delete cleanedMetadata.auto_verified;

        const { error: updateError } = await db
          .from("business_profiles")
          .update({
            account_id: null,
            claim_state: "unclaimed",
            verification_state: "unverified",
            claim_trust_level: null,
            claim_trust_reason: null,
            metadata: cleanedMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dispute.provider_id);

        if (updateError) {
          console.error("Failed to unclaim profile:", updateError);
          return NextResponse.json({ error: "Failed to unclaim provider" }, { status: 500 });
        }

        // Log unclaim audit action
        await logAuditAction({
          adminUserId: adminUser.id,
          action: "unclaim_profile",
          targetType: "business_profile",
          targetId: dispute.provider_id,
          details: {
            provider_name: profile.display_name,
            reason: "dispute_resolved",
            dispute_id: id,
          },
        });
      }

      // 3. Update dispute status to resolved
      const { error: disputeUpdateError } = await db
        .from("disputes")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", id);

      if (disputeUpdateError) {
        console.error("Failed to update dispute:", disputeUpdateError);
        return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
      }

      // Log dispute resolution audit action
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "resolve_dispute",
        targetType: "dispute",
        targetId: id,
        details: {
          provider_id: dispute.provider_id,
          provider_name: dispute.provider_name,
          claimant_email: dispute.claimant_email,
        },
      });

      // Slack alert (fire-and-forget)
      try {
        const text = `:white_check_mark: *Dispute resolved* — ${dispute.provider_name} unclaimed, disputed by ${dispute.claimant_name} (${dispute.claimant_email}). Resolved by ${user.email}`;
        await sendSlackAlert(text);
      } catch {
        // Non-blocking
      }
    } else {
      // dismiss action
      const { error: dismissError } = await db
        .from("disputes")
        .update({
          status: "rejected",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", id);

      if (dismissError) {
        console.error("Failed to dismiss dispute:", dismissError);
        return NextResponse.json({ error: "Failed to dismiss dispute" }, { status: 500 });
      }

      // Log audit action
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "dismiss_dispute",
        targetType: "dispute",
        targetId: id,
        details: {
          provider_id: dispute.provider_id,
          provider_name: dispute.provider_name,
          claimant_email: dispute.claimant_email,
        },
      });

      // Slack alert (fire-and-forget)
      try {
        const text = `:x: *Dispute dismissed* — ${dispute.provider_name} keeps current owner. Disputed by ${dispute.claimant_name}. Dismissed by ${user.email}`;
        await sendSlackAlert(text);
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin dispute action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
