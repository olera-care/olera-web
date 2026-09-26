import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { sendEmail } from "@/lib/email";
import {
  verificationApprovedEmail,
  verificationRejectedEmail,
} from "@/lib/email-templates";
import {
  medjobsProfileApprovedEmail,
  medjobsProfileRejectedEmail,
} from "@/lib/medjobs-email-templates";
import { generateStudentPortalUrl } from "@/lib/claim-tokens";
import { logAuditAction } from "@/lib/admin";
import { publishPendingInterviews } from "@/lib/notifications/publish-pending-interviews";
import { deliverPendingConnections } from "@/lib/notifications/deliver-pending-connections";
import { publishPendingQAAnswers } from "@/lib/notifications/publish-pending-qa-answers";

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * Verify the Slack request signature.
 * Returns true if valid, false otherwise.
 */
function verifySlackSignature(
  signature: string | null,
  timestamp: string | null,
  body: string
): boolean {
  if (!SLACK_SIGNING_SECRET || !signature || !timestamp) {
    console.warn("[slack] Missing signing secret or request headers");
    return false;
  }

  // Prevent replay attacks (reject requests older than 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 60 * 5) {
    console.warn("[slack] Request timestamp too old");
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${createHmac("sha256", SLACK_SIGNING_SECRET)
    .update(sigBasestring, "utf8")
    .digest("hex")}`;

  // timingSafeEqual throws if buffers have different lengths
  const myBuffer = Buffer.from(mySignature, "utf8");
  const theirBuffer = Buffer.from(signature, "utf8");
  if (myBuffer.length !== theirBuffer.length) {
    return false;
  }

  return timingSafeEqual(myBuffer, theirBuffer);
}

/**
 * Handle Slack interactive component payloads.
 * This endpoint receives button clicks from Slack messages.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-slack-request-timestamp");
    const signature = request.headers.get("x-slack-signature");

    // Verify request is from Slack
    if (!verifySlackSignature(signature, timestamp, rawBody)) {
      console.error("[slack] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the URL-encoded payload
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get("payload");
    if (!payloadStr) {
      return NextResponse.json({ error: "No payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    // We only handle block_actions (button clicks)
    if (payload.type !== "block_actions") {
      return NextResponse.json({ ok: true });
    }

    const action = payload.actions?.[0];
    if (!action) {
      return NextResponse.json({ ok: true });
    }

    const actionId = action.action_id;
    const actionValue = action.value;

    // Handle verification actions
    if (actionId === "verification_approve" || actionId === "verification_reject") {
      if (!actionValue) {
        return updateSlackMessage(payload, "❌ Missing action data");
      }
      return await handleVerificationAction(
        actionId === "verification_approve" ? "approve" : "reject",
        actionValue,
        payload
      );
    }

    // Handle student review actions
    if (actionId === "student_review_approve" || actionId === "student_review_reject") {
      if (!actionValue) {
        return updateSlackMessage(payload, "❌ Missing action data");
      }
      return await handleStudentReviewAction(
        actionId === "student_review_approve" ? "approve" : "reject",
        actionValue,
        payload
      );
    }

    // View profile is just a link, no action needed
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[slack] Interaction error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleVerificationAction(
  action: "approve" | "reject",
  value: string,
  payload: Record<string, unknown>
): Promise<NextResponse> {
  const admin = getAdminClient();
  if (!admin) {
    return updateSlackMessage(payload, "❌ Server configuration error");
  }

  // Parse action value as JSON
  let profileId: string;
  let claimerEmail: string;
  let providerName: string;
  try {
    const parsed = JSON.parse(value) as { profileId?: string; email?: string; name?: string };
    profileId = parsed.profileId || "";
    claimerEmail = parsed.email || "";
    providerName = parsed.name || "";
  } catch {
    return updateSlackMessage(payload, "❌ Invalid action data");
  }

  if (!profileId || !claimerEmail) {
    return updateSlackMessage(payload, "❌ Missing profile or email");
  }

  // Get the Slack user who clicked
  const slackUser = (payload.user as { name?: string })?.name || "Unknown";

  // Fetch the current profile
  const { data: profile, error: fetchError } = await admin
    .from("business_profiles")
    .select("id, slug, verification_state, metadata, display_name")
    .eq("id", profileId)
    .single();

  if (fetchError || !profile) {
    console.error("[slack] Profile not found:", profileId, fetchError);
    return updateSlackMessage(payload, "❌ Profile not found");
  }

  // Check if already processed
  if (profile.verification_state === "verified" && action === "approve") {
    return updateSlackMessage(payload, "✓ Already verified");
  }
  if (profile.verification_state === "rejected" && action === "reject") {
    return updateSlackMessage(payload, "✗ Already rejected");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const dashboardUrl = `${siteUrl}/provider`;
  const resubmitUrl = `${siteUrl}/provider/${profile.slug}/onboard`;
  const actualProviderName = profile.display_name || providerName || "your organization";

  if (action === "approve") {
    // Update profile to verified
    const currentMetadata = (profile.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      badge_approved: true,
      badge_approved_at: new Date().toISOString(),
      verified_by: slackUser,
      verified_via: "slack",
    };

    const { error: updateError } = await admin
      .from("business_profiles")
      .update({
        verification_state: "verified",
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("[slack] Failed to approve:", updateError);
      return updateSlackMessage(payload, "❌ Failed to update profile");
    }

    // Publish pending Q&A answers and notify askers (fire-and-forget)
    // Uses shared function to ensure Slack alerts + email notifications are sent
    publishPendingQAAnswers(
      admin,
      profileId,
      actualProviderName,
      profile.slug
    ).catch((err) => {
      console.error("[slack] Error publishing pending Q&A answers:", err);
    });

    // Deliver pending connections (fire-and-forget)
    deliverPendingConnections(
      admin,
      profileId,
      actualProviderName,
      profile.slug
    ).catch((err) => {
      console.error("[slack] Error delivering pending connections:", err);
    });

    // Release pending interviews and notify students (fire-and-forget)
    publishPendingInterviews(
      admin,
      profileId,
      actualProviderName,
      profile.slug
    ).catch((err) => {
      console.error("[slack] Error publishing pending interviews:", err);
    });

    // Send approval email
    if (claimerEmail) {
      const recipientName = (currentMetadata.verification_submission as Record<string, unknown>)?.name as string || "there";
      try {
        await sendEmail({
          to: claimerEmail,
          subject: "You're verified ✓",
          html: verificationApprovedEmail({
            providerName: actualProviderName,
            recipientName,
            dashboardUrl,
            autoApproved: false,
          }),
          emailType: "verification_approved",
          recipientType: "provider",
          providerId: profile.slug,
          metadata: { approved_by: slackUser },
        });
      } catch (emailErr) {
        console.error("[slack] Failed to send approval email:", emailErr);
      }
    }

    console.log(`[slack] Verification approved: ${actualProviderName} by ${slackUser}`);
    return updateSlackMessage(
      payload,
      `✅ *Approved* by ${slackUser}\n${actualProviderName} is now verified.`
    );
  } else {
    // Reject the verification
    const currentMetadata = (profile.metadata as Record<string, unknown>) || {};
    const rejectionReason = "Your provided information could not be verified. Please resubmit with clearer documentation.";

    const updatedMetadata = {
      ...currentMetadata,
      badge_rejected: true,
      badge_rejected_at: new Date().toISOString(),
      rejected_by: slackUser,
      rejected_via: "slack",
      rejection_reason: rejectionReason,
    };

    const { error: updateError } = await admin
      .from("business_profiles")
      .update({
        verification_state: "rejected",
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("[slack] Failed to reject:", updateError);
      return updateSlackMessage(payload, "❌ Failed to update profile");
    }

    // Send rejection email
    if (claimerEmail) {
      const recipientName = (currentMetadata.verification_submission as Record<string, unknown>)?.name as string || "there";
      try {
        await sendEmail({
          to: claimerEmail,
          subject: "Verification needs more info",
          html: verificationRejectedEmail({
            providerName: actualProviderName,
            recipientName,
            reason: rejectionReason,
            resubmitUrl,
          }),
          emailType: "verification_rejected",
          recipientType: "provider",
          providerId: profile.slug,
          metadata: { rejected_by: slackUser },
        });
      } catch (emailErr) {
        console.error("[slack] Failed to send rejection email:", emailErr);
      }
    }

    console.log(`[slack] Verification rejected: ${actualProviderName} by ${slackUser}`);
    return updateSlackMessage(
      payload,
      `❌ *Rejected* by ${slackUser}\nThe provider will be asked to resubmit.`
    );
  }
}

/**
 * Handle student review approve/reject actions from Slack buttons.
 */
async function handleStudentReviewAction(
  action: "approve" | "reject",
  value: string,
  payload: Record<string, unknown>
): Promise<NextResponse> {
  const admin = getAdminClient();
  if (!admin) {
    return updateSlackMessage(payload, "❌ Server configuration error");
  }

  // Parse action value as JSON
  let studentId: string;
  let studentEmail: string;
  let studentName: string;
  try {
    const parsed = JSON.parse(value) as { studentId?: string; email?: string; name?: string };
    studentId = parsed.studentId || "";
    studentEmail = parsed.email || "";
    studentName = parsed.name || "";
  } catch {
    return updateSlackMessage(payload, "❌ Invalid action data");
  }

  if (!studentId) {
    return updateSlackMessage(payload, "❌ Missing student ID");
  }

  // Get the Slack user who clicked
  const slackUser = (payload.user as { name?: string })?.name || "Unknown";

  // Fetch the current student profile
  const { data: student, error: fetchError } = await admin
    .from("business_profiles")
    .select("id, slug, display_name, email, is_active, metadata")
    .eq("id", studentId)
    .eq("type", "student")
    .single();

  if (fetchError || !student) {
    console.error("[slack] Student not found:", studentId, fetchError);
    return updateSlackMessage(payload, "❌ Student not found");
  }

  const meta = (student.metadata as Record<string, unknown>) || {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const actualStudentName = student.display_name || studentName || "Student";
  const actualEmail = student.email || studentEmail;

  // Check if this review request was already processed
  // Each Slack message is tied to one review request - if review_requested_at is null,
  // this request was already handled (via admin panel or another Slack message)
  if (!meta.review_requested_at) {
    if (meta.application_completed) {
      return updateSlackMessage(payload, "✓ Already approved (via admin panel)");
    }
    if (meta.rejected_at) {
      return updateSlackMessage(payload, "✗ Already rejected (via admin panel)");
    }
    return updateSlackMessage(payload, "⚠️ This review request was already processed");
  }

  // Check if already in final state
  if (meta.application_completed && action === "approve") {
    return updateSlackMessage(payload, "✓ Already approved");
  }

  const nowIso = new Date().toISOString();

  if (action === "approve") {
    // Approve: set is_active, application_completed, clear review_requested_at
    const updatedMeta = {
      ...meta,
      application_completed: true,
      review_requested_at: null,
      approved_at: nowIso,
      approved_by: slackUser,
      approved_via: "slack",
    };

    const { error: updateError } = await admin
      .from("business_profiles")
      .update({
        is_active: true,
        metadata: updatedMeta,
        updated_at: nowIso,
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("[slack] Failed to approve student:", updateError);
      return updateSlackMessage(payload, "❌ Failed to approve student");
    }

    // Log audit action (fire-and-forget, don't block on it)
    logAuditAction({
      adminUserId: `slack:${slackUser}`,
      action: "approve_student",
      targetType: "student",
      targetId: studentId,
      details: {
        studentName: actualStudentName,
        studentEmail: actualEmail,
        approved_via: "slack",
      },
    }).catch((err) => {
      console.error("[slack] Failed to log audit action:", err);
    });

    // Send approval email
    if (actualEmail) {
      try {
        const portalUrl = generateStudentPortalUrl(actualEmail, "/portal/medjobs");
        const profileUrl = student.slug
          ? `${siteUrl}/medjobs/candidates/${student.slug}`
          : portalUrl;

        await sendEmail({
          to: actualEmail,
          subject: "Your MedJobs profile is live!",
          html: medjobsProfileApprovedEmail({
            studentName: actualStudentName,
            profileUrl,
            portalUrl,
          }),
          emailType: "medjobs_profile_approved",
          recipientType: "student",
          recipientProfileId: studentId,
          metadata: { approved_by: slackUser, approved_via: "slack" },
        });
      } catch (emailErr) {
        console.error("[slack] Failed to send student approval email:", emailErr);
      }
    }

    console.log(`[slack] Student approved: ${actualStudentName} by ${slackUser}`);
    return updateSlackMessage(
      payload,
      `✅ *Approved* by ${slackUser}\n${actualStudentName} is now live.`
    );
  } else {
    // Reject: set rejected_at, rejection_reason, clear review_requested_at
    const rejectionReason = "Your profile needs some updates before it can go live. Please review your information and try again.";

    const updatedMeta = {
      ...meta,
      review_requested_at: null,
      rejected_at: nowIso,
      rejected_by: slackUser,
      rejected_via: "slack",
      rejection_reason: rejectionReason,
    };

    const { error: updateError } = await admin
      .from("business_profiles")
      .update({
        metadata: updatedMeta,
        updated_at: nowIso,
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("[slack] Failed to reject student:", updateError);
      return updateSlackMessage(payload, "❌ Failed to reject student");
    }

    // Log audit action (fire-and-forget, don't block on it)
    logAuditAction({
      adminUserId: `slack:${slackUser}`,
      action: "reject_student",
      targetType: "student",
      targetId: studentId,
      details: {
        studentName: actualStudentName,
        studentEmail: actualEmail,
        rejectionReason,
        rejected_via: "slack",
      },
    }).catch((err) => {
      console.error("[slack] Failed to log audit action:", err);
    });

    // Send rejection email
    if (actualEmail) {
      try {
        const portalUrl = generateStudentPortalUrl(actualEmail, "/portal/medjobs");

        await sendEmail({
          to: actualEmail,
          subject: "Your MedJobs profile needs some updates",
          html: medjobsProfileRejectedEmail({
            studentName: actualStudentName,
            reason: rejectionReason,
            portalUrl,
          }),
          emailType: "medjobs_profile_rejected",
          recipientType: "student",
          recipientProfileId: studentId,
          metadata: { rejected_by: slackUser, rejected_via: "slack" },
        });
      } catch (emailErr) {
        console.error("[slack] Failed to send student rejection email:", emailErr);
      }
    }

    console.log(`[slack] Student rejected: ${actualStudentName} by ${slackUser}`);
    return updateSlackMessage(
      payload,
      `❌ *Rejected* by ${slackUser}\n${actualStudentName} will be asked to update their profile.`
    );
  }
}

/**
 * Update the original Slack message with the action result.
 */
function updateSlackMessage(
  payload: Record<string, unknown>,
  resultText: string
): NextResponse {
  // Get the original blocks and replace the actions block with the result
  const originalBlocks = (payload.message as { blocks?: unknown[] })?.blocks || [];

  // Remove the actions block and add a result context
  const updatedBlocks = originalBlocks.filter(
    (block: unknown) => (block as { type?: string }).type !== "actions"
  );

  updatedBlocks.push({
    type: "section",
    text: { type: "mrkdwn", text: resultText },
  });

  // Slack expects us to respond with the updated message
  return NextResponse.json({
    replace_original: true,
    blocks: updatedBlocks,
  });
}
