import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  renderEmail,
  buildContextFromProvider,
  PROVIDER_OUTREACH_EMAIL_TYPE,
  PROVIDER_OUTREACH_FROM,
  PROVIDER_OUTREACH_REPLY_TO,
} from "@/lib/provider-outreach";
import { OUTREACH_STAGES, type OutreachStage } from "../route";
import { NOT_INTERESTED_REASON_VALUES, type NotInterestedReason } from "@/lib/provider-outreach";

/**
 * POST /api/admin/provider-outreach/record-outcome
 *
 * Record an outcome for a provider in the Follow Up (needs_call) stage.
 * This powers the follow-up workflow with proper counter/date management.
 *
 * Note: "Claimed" is NOT an outcome here - auto-claim detection (migration 133)
 * automatically moves providers to "claimed" when they claim via any method.
 *
 * Request body:
 *   - provider_id: string (required)
 *   - outcome: string (required) - one of the valid outcomes
 *   - notes?: string - optional notes
 *
 * Outcomes and their effects:
 *
 * | Outcome          | Counter/Date Updates            | Stage Change    | Channel         |
 * |------------------|--------------------------------|-----------------|-----------------|
 * | resend_link      | resend_count++                 | → re_engage     | (sends email)   |
 * | wrong_contact    | clears email                   | → not_contacted | -               |
 * | not_interested   | -                              | → not_interested| -               |
 * | try_fax          | -                              | → re_engage     | fax             |
 * | try_contact_form | -                              | → re_engage     | contact_form    |
 * | try_direct_mail  | -                              | → re_engage     | direct_mail     |
 *
 * Note: "not_interested" is a soft terminal - stops outreach but questions/connections still flow.
 * Use the Archive action (via action modal) for hard terminal with system-wide block.
 *
 * The try_fax/try_contact_form/try_direct_mail outcomes move providers to the Alternative Channels
 * tab where they can be followed up via fax, contact form, or direct mail.
 */

const VALID_OUTCOMES = [
  "resend_link",
  "wrong_contact",
  "not_interested",
  "try_fax",
  "try_contact_form",
  "try_direct_mail",
] as const;

type FollowUpOutcome = (typeof VALID_OUTCOMES)[number];

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_id, outcome, notes, not_interested_reason } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!outcome || !VALID_OUTCOMES.includes(outcome as FollowUpOutcome)) {
      return NextResponse.json(
        { error: `Invalid outcome. Must be one of: ${VALID_OUTCOMES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate not_interested_reason if outcome is not_interested
    if (outcome === "not_interested") {
      if (!not_interested_reason || !NOT_INTERESTED_REASON_VALUES.includes(not_interested_reason as NotInterestedReason)) {
        return NextResponse.json(
          { error: `not_interested_reason is required. Must be one of: ${NOT_INTERESTED_REASON_VALUES.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // Get current tracking record
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, resend_count, due_date, city, state, sequence_started_at, email_source")
      .eq("provider_id", provider_id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Provider not found in tracking" }, { status: 404 });
    }

    // Verify provider is in needs_call stage
    if (tracking.stage !== "needs_call") {
      return NextResponse.json(
        { error: `Provider must be in Follow Up stage. Current stage: ${tracking.stage}` },
        { status: 400 }
      );
    }

    // Current counter values (default to 0 if null)
    const currentResendCount = tracking.resend_count ?? 0;

    // Process outcome - determine updates
    let newStage: OutreachStage | null = null;
    let newResendCount = currentResendCount;
    let clearEmail = false;
    let shouldSendNudgeEmail = false;
    let newReEngageChannel: string | null = null;
    let shouldSetSequenceStartedAt = false;

    switch (outcome as FollowUpOutcome) {
      case "resend_link":
        // No limit - track count and resend
        newResendCount = currentResendCount + 1;
        newStage = "re_engage"; // Move to re-engage after sending email
        shouldSendNudgeEmail = true;
        // Set sequence_started_at if not already set, so this provider counts in Sequence Conv.
        shouldSetSequenceStartedAt = !tracking.sequence_started_at;
        break;

      case "wrong_contact":
        newStage = "not_contacted";
        clearEmail = true;
        break;

      case "not_interested":
        // Soft terminal - no system-wide archive sync
        // Provider stops receiving outreach but can still get questions/connections
        newStage = "not_interested";
        break;

      case "try_fax":
        // Move to re-engage with fax channel for follow-up via fax
        newStage = "re_engage";
        newReEngageChannel = "fax";
        // Set sequence_started_at so this provider counts in Sequence Conv. if they claim
        shouldSetSequenceStartedAt = !tracking.sequence_started_at;
        break;

      case "try_contact_form":
        // Move to re-engage with contact_form channel for website contact form outreach
        newStage = "re_engage";
        newReEngageChannel = "contact_form";
        // Set sequence_started_at so this provider counts in Sequence Conv. if they claim
        shouldSetSequenceStartedAt = !tracking.sequence_started_at;
        break;

      case "try_direct_mail":
        // Move to re-engage with direct_mail channel for postcard/mail outreach
        newStage = "re_engage";
        newReEngageChannel = "direct_mail";
        // Set sequence_started_at so this provider counts in Sequence Conv. if they claim
        shouldSetSequenceStartedAt = !tracking.sequence_started_at;
        break;
    }

    // ── Update tracking record ──

    const updateData: Record<string, unknown> = {
      updated_at: nowIso,
    };

    if (newResendCount !== currentResendCount) {
      updateData.resend_count = newResendCount;
    }

    // Set sequence_started_at so provider counts in Sequence Conv. if they claim.
    // Also set sequenced_with_source for accurate conversion tracking by channel.
    if (shouldSetSequenceStartedAt) {
      updateData.sequence_started_at = nowIso;
      // For alternative channels, track the channel as source. Otherwise use email source.
      const alternativeChannels = ["fax", "contact_form", "direct_mail"];
      updateData.sequenced_with_source = newReEngageChannel && alternativeChannels.includes(newReEngageChannel)
        ? newReEngageChannel
        : (tracking.email_source || "organization");
    }

    if (newStage) {
      updateData.stage = newStage;
      updateData.stage_changed_at = nowIso;

      if (notes?.trim()) {
        updateData.notes = notes.trim();
      }

      // Set re_engage_channel and channel_entered_at if moving to re_engage with a specific channel
      // channel_entered_at is used by the lifecycle cron to determine when to progress between channels
      if (newReEngageChannel) {
        updateData.re_engage_channel = newReEngageChannel;
        updateData.channel_entered_at = nowIso;
      }
    } else if (notes?.trim()) {
      // Append notes without stage change (use existing or set new)
      updateData.notes = notes.trim();
    }

    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update(updateData)
      .eq("id", tracking.id);

    if (updateError) {
      console.error("[record-outcome] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update tracking record" }, { status: 500 });
    }

    // ── Clear email if wrong_contact ──

    if (clearEmail) {
      const { error: emailError } = await db
        .from("olera-providers")
        .update({ email: null, updated_at: nowIso })
        .eq("provider_id", provider_id);

      if (emailError) {
        console.error("[record-outcome] Clear email error:", emailError);
        // Non-fatal, continue
      }
    }

    // ── Send nudge email if resend_link ──

    let emailSent = false;
    let emailLogId: string | undefined;
    let emailError: string | undefined;

    if (shouldSendNudgeEmail) {
      // Fetch provider data for email rendering
      const { data: provider, error: providerError } = await db
        .from("olera-providers")
        .select("provider_id, slug, provider_name, email, city, state, provider_category")
        .eq("provider_id", provider_id)
        .single();

      if (providerError || !provider) {
        console.error("[record-outcome] Failed to fetch provider for email:", providerError);
        emailError = "Failed to fetch provider data";
      } else if (!provider.email) {
        console.error("[record-outcome] Provider has no email:", provider_id);
        emailError = "Provider has no email address";
      } else {
        // Check if email is suppressed (bounced, unsubscribed, etc.)
        const { data: verification } = await db
          .from("email_verifications")
          .select("status")
          .eq("email", provider.email.toLowerCase())
          .maybeSingle();

        const { data: dnc } = await db
          .from("do_not_contact")
          .select("id")
          .eq("email", provider.email.toLowerCase())
          .maybeSingle();

        const isSuppressed =
          verification?.status === "invalid" ||
          verification?.status === "catch-all" ||
          !!dnc;

        if (isSuppressed) {
          console.log("[record-outcome] Email suppressed:", provider.email);
          emailError = "Email address is suppressed (bounced or unsubscribed)";
        } else {
          // Build context and render nudge email
          const context = buildContextFromProvider({
            provider_id: provider.provider_id,
            name: provider.provider_name,
            email: provider.email,
            city: provider.city,
            state: provider.state,
            category: provider.provider_category,
            slug: provider.slug,
          });

          const rendered = renderEmail("nudge", context);

          // Send via Resend
          const sendResult = await sendEmail({
            to: provider.email,
            from: PROVIDER_OUTREACH_FROM,
            replyTo: PROVIDER_OUTREACH_REPLY_TO,
            subject: rendered.subject,
            html: rendered.html,
            emailType: PROVIDER_OUTREACH_EMAIL_TYPE,
            providerId: provider_id,
            metadata: {
              template_key: "nudge",
              trigger: "resend_link_outcome",
              resend_count: newResendCount,
            },
          });

          if (sendResult.success) {
            emailSent = true;
            emailLogId = sendResult.emailLogId;
            console.log("[record-outcome] Nudge email sent:", provider.email, emailLogId);
          } else {
            emailError = sendResult.error || "Failed to send email";
            console.error("[record-outcome] Email send failed:", emailError);
          }
        }
      }
    }

    // ── Log touchpoints ──

    const touchpointRows: Array<{
      provider_id: string;
      touchpoint_type: string;
      details: Record<string, unknown>;
      admin_user_id: string;
      created_at: string;
    }> = [];

    // Always log outcome_recorded
    touchpointRows.push({
      provider_id,
      touchpoint_type: "outcome_recorded",
      details: {
        outcome,
        resend_count: newResendCount,
        ...(notes?.trim() && { notes: notes.trim() }),
        ...(newStage && { triggered_stage_change: newStage }),
        ...(newReEngageChannel && { re_engage_channel: newReEngageChannel }),
        ...(clearEmail && { email_cleared: true }),
        ...(shouldSendNudgeEmail && { email_sent: emailSent, email_error: emailError }),
        ...(outcome === "not_interested" && not_interested_reason && { not_interested_reason }),
      },
      admin_user_id: adminUser.id,
      created_at: nowIso,
    });

    // Log email_sent touchpoint if nudge email was sent
    if (emailSent) {
      touchpointRows.push({
        provider_id,
        touchpoint_type: "email_sent",
        details: {
          template_key: "nudge",
          trigger: "resend_link_outcome",
          email_log_id: emailLogId,
          resend_count: newResendCount,
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });
    }

    // Also log stage_changed if stage moved
    if (newStage) {
      touchpointRows.push({
        provider_id,
        touchpoint_type: "stage_changed",
        details: {
          old_stage: "needs_call",
          new_stage: newStage,
          trigger: `outcome_${outcome}`,
          ...(newReEngageChannel && { re_engage_channel: newReEngageChannel }),
          ...(notes?.trim() && { notes: notes.trim() }),
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });
    }

    const { error: touchpointError } = await db
      .from("provider_outreach_touchpoints")
      .insert(touchpointRows);

    if (touchpointError) {
      // Non-fatal: log but don't fail the request
      console.error("[record-outcome] Touchpoint insert error:", touchpointError);
    }

    return NextResponse.json({
      success: true,
      outcome,
      stage_changed: !!newStage,
      new_stage: newStage,
      resend_count: newResendCount,
      // Channel for try_fax/try_linkedin/try_direct_mail outcomes
      ...(newReEngageChannel && { re_engage_channel: newReEngageChannel }),
      // Email status for resend_link outcome
      ...(shouldSendNudgeEmail && {
        email_sent: emailSent,
        email_log_id: emailLogId,
        email_error: emailError,
      }),
    });
  } catch (err) {
    console.error("[record-outcome] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
