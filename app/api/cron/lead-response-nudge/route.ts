import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { providerNudgeEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";

/**
 * GET /api/cron/lead-response-nudge
 *
 * Runs weekly on Thursday 2 PM UTC (~9 AM ET). Nudges providers who haven't
 * responded to leads:
 *
 * Criteria:
 * - Connection type is 'inquiry' or 'request'
 * - Lead is at least 3 days old
 * - Provider has NOT responded (no message from provider in thread)
 * - Provider HAS an email address
 * - Provider was NOT nudged in the last 7 days
 *
 * Uses the same providerNudgeEmail template as the manual admin nudge.
 */
export const maxDuration = 120;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type ThreadMessage = {
  from_profile_id: string;
  text?: string;
  created_at: string;
  is_auto_reply?: boolean;
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const dryRun = searchParams.get("dry_run") === "true";
  const limit = Math.min(500, parseInt(searchParams.get("limit") || "500", 10));
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("lead-response-nudge", async () => {
    const db = getServiceClient();
    const siteUrl = getSiteUrl();
    const now = Date.now();
    const threeDaysAgo = new Date(now - THREE_DAYS_MS).toISOString();

    const counts = {
      processed: 0,
      sent: 0,
      skipped: 0,
      skipReasons: {
        responded: 0,
        no_email: 0,
        recently_nudged: 0,
        send_failed: 0,
      },
      dry_run: dryRun,
    };

    // Fetch leads that are at least 3 days old
    const { data: connections, error: fetchError } = await db
      .from("connections")
      .select(
        `
        id,
        from_profile_id,
        to_profile_id,
        message,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name),
        to_profile:business_profiles!connections_to_profile_id_fkey(display_name, slug, source_provider_id, email)
      `
      )
      .in("type", ["inquiry", "request"])
      .lte("created_at", threeDaysAgo)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("[cron/lead-response-nudge] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!connections?.length) {
      return {
        ok: true,
        message: "No leads to process",
        ...counts,
      };
    }

    for (const conn of connections) {
      counts.processed++;

      // Normalize joined relations
      const fromProfile = Array.isArray(conn.from_profile)
        ? conn.from_profile[0]
        : conn.from_profile;
      const toProfile = Array.isArray(conn.to_profile)
        ? conn.to_profile[0]
        : conn.to_profile;

      const meta = (conn.metadata as Record<string, unknown>) ?? {};
      const thread = (meta.thread as ThreadMessage[]) || [];

      // Check if provider has responded (any non-auto-reply message from provider)
      const providerResponded = thread.some(
        (m) => m.from_profile_id === conn.to_profile_id && m.is_auto_reply !== true
      );
      if (providerResponded) {
        counts.skipped++;
        counts.skipReasons.responded++;
        continue;
      }

      // Check if provider has email
      const providerEmail = toProfile?.email?.trim();
      if (!providerEmail) {
        counts.skipped++;
        counts.skipReasons.no_email++;
        continue;
      }

      // Check cooldown (7 days)
      const lastNudgedAt = meta.nudged_at as string | undefined;
      if (lastNudgedAt) {
        const timeSinceNudge = now - new Date(lastNudgedAt).getTime();
        if (timeSinceNudge < SEVEN_DAYS_MS) {
          counts.skipped++;
          counts.skipReasons.recently_nudged++;
          continue;
        }
      }

      // Calculate days since inquiry
      const daysSinceInquiry = Math.floor(
        (now - new Date(conn.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Extract message preview
      let messagePreview: string | null = null;
      if (conn.message) {
        try {
          const msgJson = JSON.parse(String(conn.message));
          messagePreview = msgJson.additional_notes || msgJson.message || msgJson.notes || null;
        } catch {
          messagePreview = String(conn.message);
        }
      }
      if (!messagePreview && thread.length > 0 && thread[0].text) {
        messagePreview = thread[0].text;
      }
      if (messagePreview && messagePreview.length > 100) {
        messagePreview = messagePreview.substring(0, 97) + "...";
      }

      const providerSlug = toProfile?.slug || toProfile?.source_provider_id || "";
      const providerName = toProfile?.display_name || "Your Organization";
      const familyName = fromProfile?.display_name || "A family";

      if (dryRun) {
        console.log(`[cron/lead-response-nudge] [DRY RUN] Would nudge ${providerEmail} for connection ${conn.id}`);
        counts.sent++;
        continue;
      }

      // Reserve email log ID for tracking
      const emailLogId = await reserveEmailLogId({
        to: providerEmail,
        subject: `${familyName} is waiting for a response`,
        emailType: "provider_nudge",
        recipientType: "provider",
        providerId: providerSlug,
        metadata: {
          connection_id: conn.id,
          nudged_by: "cron:lead-response-nudge",
          days_since_inquiry: daysSinceInquiry,
        },
      });

      // Build view URL with tracking
      const viewUrl = appendTrackingParams(`${siteUrl}/provider/connections`, emailLogId);

      // Build and send email
      const html = providerNudgeEmail({
        providerName,
        familyName,
        messagePreview,
        daysSinceInquiry,
        viewUrl,
        providerSlug,
      });

      const { success, error: sendError } = await sendEmail({
        to: providerEmail,
        subject: `${familyName} is waiting for a response`,
        html,
        emailType: "provider_nudge",
        recipientType: "provider",
        providerId: providerSlug,
        metadata: {
          connection_id: conn.id,
          nudged_by: "cron:lead-response-nudge",
          days_since_inquiry: daysSinceInquiry,
        },
        emailLogId: emailLogId ?? undefined,
      });

      if (!success) {
        console.error(`[cron/lead-response-nudge] Send failed for ${conn.id}:`, sendError);
        counts.skipped++;
        counts.skipReasons.send_failed++;
        continue;
      }

      // Update connection metadata
      const nudgedAt = new Date().toISOString();
      const updatedMeta = {
        ...meta,
        nudged_at: nudgedAt,
        nudged_by: "cron:lead-response-nudge",
        nudge_count: ((meta.nudge_count as number) || 0) + 1,
      };

      const { error: updateError } = await db
        .from("connections")
        .update({ metadata: updatedMeta })
        .eq("id", conn.id);

      if (updateError) {
        console.error(`[cron/lead-response-nudge] Failed to update metadata for ${conn.id}:`, updateError);
        // Don't fail - email was sent
      }

      counts.sent++;
    }

    return {
      ok: true,
      ...counts,
    };
  });
}
