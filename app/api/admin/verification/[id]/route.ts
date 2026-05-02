import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendSlackAlert } from "@/lib/slack";
import { sendEmail } from "@/lib/email";
import { verificationDecisionEmail } from "@/lib/email-templates";
import { sendLoopsEvent } from "@/lib/loops";
import { deliverPendingConnections } from "@/lib/notifications/deliver-pending-connections";
import { publishPendingQAAnswers } from "@/lib/notifications/publish-pending-qa-answers";
import { publishPendingInterviews } from "@/lib/notifications/publish-pending-interviews";

/**
 * PATCH /api/admin/verification/[id]
 *
 * Approve, reject, or unclaim provider identity verification.
 * Body: { action: "approve" | "reject" | "unclaim" }
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

    if (!["approve", "reject", "unclaim"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'unclaim'." },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Handle unclaim action separately
    if (action === "unclaim") {
      // 1. Get current profile to verify it's claimed
      const { data: profile, error: fetchError } = await db
        .from("business_profiles")
        .select("account_id, display_name, metadata")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Failed to fetch profile:", fetchError);
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      if (!profile?.account_id) {
        return NextResponse.json({ error: "Provider is not claimed" }, { status: 400 });
      }

      // 2. Clear active_profile_id from accounts if this was active
      const { error: accountError } = await db
        .from("accounts")
        .update({ active_profile_id: null, updated_at: new Date().toISOString() })
        .eq("active_profile_id", id);

      if (accountError) {
        console.error("Failed to clear active_profile_id:", accountError);
        // Non-blocking - continue with unclaim
      }

      // 3. Reset claim fields and clear verification metadata
      const currentMetadata = (profile.metadata as Record<string, unknown>) || {};
      const cleanedMetadata = { ...currentMetadata };
      // Remove verification-related fields
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
        .eq("id", id);

      if (updateError) {
        console.error("Failed to unclaim profile:", updateError);
        return NextResponse.json({ error: "Failed to unclaim provider" }, { status: 500 });
      }

      // 4. Log audit action
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "unclaim_profile",
        targetType: "business_profile",
        targetId: id,
        details: {
          provider_name: profile.display_name,
        },
      });

      // 5. Slack alert (fire-and-forget)
      try {
        const text = `:recycle: *Provider unclaimed* — ${profile.display_name || id} by ${user.email}`;
        await sendSlackAlert(text);
      } catch {
        // Non-blocking
      }

      return NextResponse.json({ ok: true });
    }

    // First fetch the current profile to get metadata
    const { data: currentProfile, error: fetchError } = await db
      .from("business_profiles")
      .select("metadata")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch profile:", fetchError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Update metadata with badge status and verification_state
    const currentMetadata = (currentProfile?.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      badge_approved: action === "approve",
      badge_approved_at: action === "approve" ? new Date().toISOString() : null,
      badge_rejected: action === "reject",
      badge_rejected_at: action === "reject" ? new Date().toISOString() : null,
      ...(action === "approve" && {
        verified_at: new Date().toISOString(),
        verification_method: "admin_approval",
      }),
    };

    // Set verification_state based on action
    const newVerificationState = action === "approve" ? "verified" : "rejected";

    // When approving, also set claim_state to "claimed" to complete the claim
    // This ensures the Verification page is the single source of truth for provider approvals
    const updateData: Record<string, unknown> = {
      verification_state: newVerificationState,
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    };
    if (action === "approve") {
      updateData.claim_state = "claimed";
    }

    const { data: profile, error: updateError } = await db
      .from("business_profiles")
      .update(updateData)
      .eq("id", id)
      .select("id, display_name, verification_state, account_id, slug, metadata")
      .single();

    if (updateError) {
      console.error("Failed to update verification:", updateError);
      return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
    }

    // If approved, publish any pending Q&A answers and deliver pending connections
    if (action === "approve") {
      // Publish any pending Q&A answers and notify askers (fire-and-forget)
      publishPendingQAAnswers(
        db,
        id,
        profile?.display_name || "A provider",
        profile?.slug
      ).catch((err) => {
        console.error("[admin] Error publishing pending Q&A answers:", err);
      });

      // Deliver all pending_verification connections with notifications (fire-and-forget)
      // These are inquiries the provider saved while unverified
      deliverPendingConnections(
        db,
        id,
        profile?.display_name || "A provider",
        profile?.slug
      ).catch((err) => {
        console.error("[admin] Error delivering pending connections:", err);
      });

      // Release pending interviews and notify students (fire-and-forget)
      publishPendingInterviews(
        db,
        id,
        profile?.display_name || "A provider",
        profile?.slug
      ).catch((err) => {
        console.error("[admin] Error publishing pending interviews:", err);
      });
    } else {
      // If rejected, archive the pending_verification connections
      // The provider can't deliver these since they're not verified
      try {
        const { error: archiveError, count: archivedCount } = await db
          .from("connections")
          .update({
            status: "archived",
            updated_at: new Date().toISOString(),
          })
          .eq("from_profile_id", id)
          .eq("status", "pending_verification");

        if (archiveError) {
          console.error("[admin] Failed to archive pending connections:", archiveError);
        } else if (archivedCount && archivedCount > 0) {
          console.log(`[admin] Archived ${archivedCount} pending connections for rejected provider ${profile?.display_name}`);
        }
      } catch (archiveErr) {
        console.error("[admin] Error archiving pending connections:", archiveErr);
        // Non-blocking
      }
    }

    // Log audit action
    const auditAction = action === "approve"
      ? "approve_badge"
      : "reject_badge";
    await logAuditAction({
      adminUserId: adminUser.id,
      action: auditAction,
      targetType: "business_profile",
      targetId: id,
      details: {
        provider_name: profile?.display_name,
        badge_approved: action === "approve",
      },
    });

    // Slack alert (fire-and-forget)
    try {
      const emoji = action === "approve" ? ":white_check_mark:" : ":x:";
      const text = `${emoji} *Badge ${action}d* — ${profile?.display_name || id} by ${user.email}`;
      await sendSlackAlert(text);
    } catch {
      // Non-blocking
    }

    // Email + Loops notification to provider (fire-and-forget)
    try {
      if (profile?.account_id) {
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
                ? "Your Olera profile is now verified!"
                : "Your Olera verification needs attention",
              html: verificationDecisionEmail({
                providerName: profile.display_name || "Your organization",
                approved: action === "approve",
                listingUrl,
              }),
              emailType: "verification_decision",
              recipientType: "provider",
              providerId: id,
            });
            await sendLoopsEvent({
              email: providerEmail,
              eventName: action === "approve" ? "verification_approved" : "verification_rejected",
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
    console.error("Admin verification action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
