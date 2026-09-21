/**
 * GET /api/admin/provider-outreach/email-health
 *
 * Returns email health metrics for a provider to determine broadcast eligibility.
 *
 * Query params:
 *   - provider_id: The provider ID to check
 *
 * Returns:
 *   - email: The email address being checked
 *   - delivered: Number of successfully delivered emails
 *   - bounced: Number of bounced emails
 *   - complained: Number of spam complaints
 *   - lastDeliveredAt: Timestamp of last successful delivery
 *   - lastCalledAt: Timestamp of last call (from touchpoints)
 *   - eligible: Boolean - true if eligible to move to broadcast_ready
 *   - reason: If not eligible, explains why
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("provider_id");

  if (!providerId) {
    return NextResponse.json({ error: "provider_id required" }, { status: 400 });
  }

  const db = getServiceClient();

  try {
    // Get provider's email from tracking table (apollo_contact or olera-providers)
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, apollo_contact, stage")
      .eq("provider_id", providerId)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Provider not found in outreach tracking" }, { status: 404 });
    }

    // Get email from olera-providers (directory email) - this is the ONLY source of truth
    // Apollo email is never used as fallback - admin must explicitly approve and copy it to directory first
    const { data: provider } = await db
      .from("olera-providers")
      .select("email")
      .eq("provider_id", providerId)
      .single();

    const email: string | null = provider?.email || null;

    if (!email) {
      return NextResponse.json({
        email: null,
        delivered: 0,
        bounced: 0,
        complained: 0,
        lastDeliveredAt: null,
        lastCalledAt: null,
        eligible: false,
        reason: "No email on file",
      });
    }

    // Get email metrics from email_log (Resend emails)
    const { data: emailLogs, error: logError } = await db
      .from("email_log")
      .select("status, delivered_at, bounced_at, complained_at, created_at")
      .eq("recipient", email)
      .order("created_at", { ascending: false });

    if (logError) {
      console.error("[email-health] Failed to fetch email logs:", logError);
      return NextResponse.json({ error: "Failed to fetch email logs" }, { status: 500 });
    }

    const logs = emailLogs || [];
    // Count Resend delivered: emails that were sent/delivered AND did not bounce
    const resendDelivered = logs.filter((l) => (l.delivered_at || l.status === "sent") && !l.bounced_at).length;
    const bounced = logs.filter((l) => l.bounced_at).length;
    const complained = logs.filter((l) => l.complained_at).length;

    // Get SmartLead email touchpoints (these are tracked separately from email_log)
    // SmartLead emails are recorded in provider_outreach_touchpoints with source: "smartlead"
    const { data: smartleadTouchpoints } = await db
      .from("provider_outreach_touchpoints")
      .select("created_at, details")
      .eq("provider_id", providerId)
      .eq("touchpoint_type", "email_sent")
      .order("created_at", { ascending: false });

    // Count SmartLead delivered: touchpoints that are SmartLead emails and not bounced
    // SmartLead emails are identified by:
    //   1. source === "smartlead" (set by sync and newer webhook code)
    //   2. OR sequence_step is present (1-4, SmartLead's sequence indicator)
    // Resend emails use cadence_day/template_key instead, so sequence_step is a reliable SmartLead marker
    const smartleadEmails = (smartleadTouchpoints || []).filter((tp) => {
      const details = tp.details as { source?: string; sequence_step?: number; is_bounced?: boolean } | null;
      const isSmartlead = details?.source === "smartlead" ||
        (typeof details?.sequence_step === "number" && details.sequence_step >= 1 && details.sequence_step <= 4);
      return isSmartlead;
    });
    const smartleadDelivered = smartleadEmails.filter((tp) => {
      const details = tp.details as { is_bounced?: boolean } | null;
      return !details?.is_bounced;
    }).length;
    const smartleadBounced = smartleadEmails.filter((tp) => {
      const details = tp.details as { is_bounced?: boolean } | null;
      return details?.is_bounced === true;
    }).length;

    // Total delivered = Resend + SmartLead (non-bounced)
    const delivered = resendDelivered + smartleadDelivered;
    const totalBounced = bounced + smartleadBounced;

    // Find last delivered timestamp (from either source)
    const resendDeliveredLogs = logs.filter((l) => (l.delivered_at || l.status === "sent") && !l.bounced_at);
    const lastResendDeliveredAt = resendDeliveredLogs.length > 0
      ? resendDeliveredLogs[0].delivered_at || resendDeliveredLogs[0].created_at
      : null;
    const smartleadDeliveredTps = smartleadEmails.filter((tp) => {
      const details = tp.details as { is_bounced?: boolean } | null;
      return !details?.is_bounced;
    });
    const lastSmartleadDeliveredAt = smartleadDeliveredTps.length > 0
      ? smartleadDeliveredTps[0].created_at
      : null;
    // Pick the most recent delivered timestamp from either source
    const lastDeliveredAt = [lastResendDeliveredAt, lastSmartleadDeliveredAt]
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || null;

    // Get last call timestamp from touchpoints
    // Note: touchpoint_type is "call_attempted" not "call"
    const { data: touchpoints } = await db
      .from("provider_outreach_touchpoints")
      .select("created_at")
      .eq("provider_id", providerId)
      .eq("touchpoint_type", "call_attempted")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastCalledAt = touchpoints && touchpoints.length > 0
      ? touchpoints[0].created_at
      : null;

    // Determine eligibility
    let eligible = true;
    let reason: string | null = null;

    if (delivered === 0) {
      eligible = false;
      reason = "No emails delivered yet";
    } else if (totalBounced > 0) {
      eligible = false;
      reason = `Has ${totalBounced} bounce${totalBounced > 1 ? "s" : ""}`;
    } else if (complained > 0) {
      eligible = false;
      reason = `Has ${complained} complaint${complained > 1 ? "s" : ""}`;
    } else if (!lastCalledAt) {
      eligible = false;
      reason = "Not called yet";
    }

    return NextResponse.json({
      email,
      delivered,
      bounced: totalBounced,
      complained,
      lastDeliveredAt,
      lastCalledAt,
      eligible,
      reason,
    });
  } catch (err) {
    console.error("[email-health] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
