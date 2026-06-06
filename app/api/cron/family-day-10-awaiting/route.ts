import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { day10AwaitingEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";

/**
 * GET /api/cron/family-day-10-awaiting
 *
 * Runs daily. Sends warm hand email to families ~10 days after provider responds
 * but family still hasn't replied. Offers human support and alternatives.
 *
 * This fills the gap between Email #3 (Day 3 gentle nudge) and STUCK mark (Day 14).
 *
 * Trigger conditions:
 * - Provider has responded (at least one non-auto-reply message from provider)
 * - Family has NOT replied (no messages from family after provider's first message)
 * - ~10 days since provider's first message (9-11 days)
 * - Email not already sent (day_10_awaiting_sent_at not set)
 * - Send ONCE per connection
 *
 * Tone: Help, never pressure. "We're here," not "last chance."
 */

export const maxDuration = 120;

const NINE_DAYS_MS = 9 * 24 * 60 * 60 * 1000;
const ELEVEN_DAYS_MS = 11 * 24 * 60 * 60 * 1000;

interface ThreadMessage {
  from_profile_id: string;
  text?: string;
  created_at: string;
  is_auto_reply?: boolean;
}

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

  return withCronRun("family-day-10-awaiting", async () => {
    const db = getServiceClient();
    const siteUrl = getSiteUrl();
    const now = Date.now();
    const nineDaysAgo = new Date(now - NINE_DAYS_MS).toISOString();
    const elevenDaysAgo = new Date(now - ELEVEN_DAYS_MS).toISOString();

    const counts = {
      processed: 0,
      sent: 0,
      skipped: 0,
      skipReasons: {
        provider_not_responded: 0,
        family_already_replied: 0,
        too_soon: 0,
        too_late: 0,
        already_sent: 0,
        no_email: 0,
        send_failed: 0,
      },
      dry_run: dryRun,
    };

    // Fetch inquiry connections (family → provider)
    // We'll filter by provider response timing in the loop
    const { data: connections, error: fetchError } = await db
      .from("connections")
      .select(
        `
        id,
        from_profile_id,
        to_profile_id,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(
          id,
          display_name,
          email,
          account_id,
          type
        ),
        to_profile:business_profiles!connections_to_profile_id_fkey(
          id,
          display_name,
          slug,
          city,
          state
        )
      `
      )
      .eq("type", "inquiry")
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("[cron/family-day-10-awaiting] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!connections?.length) {
      return {
        ok: true,
        message: "No connections to process",
        ...counts,
      };
    }

    for (const conn of connections) {
      counts.processed++;

      // Normalize joined relations
      const familyProfile = Array.isArray(conn.from_profile)
        ? conn.from_profile[0]
        : conn.from_profile;
      const providerProfile = Array.isArray(conn.to_profile)
        ? conn.to_profile[0]
        : conn.to_profile;

      const meta = (conn.metadata as Record<string, unknown>) ?? {};

      // Skip if already sent
      if (meta.day_10_awaiting_sent_at) {
        counts.skipped++;
        counts.skipReasons.already_sent++;
        continue;
      }

      const thread = (meta.thread as ThreadMessage[]) || [];
      const humanMessages = thread.filter((m) => !m.is_auto_reply);

      if (humanMessages.length === 0) {
        counts.skipped++;
        counts.skipReasons.provider_not_responded++;
        continue;
      }

      // Find provider's first message (non-auto-reply)
      const providerFirstMessage = humanMessages.find(
        (m) => m.from_profile_id === conn.to_profile_id
      );

      // Provider hasn't responded yet
      if (!providerFirstMessage) {
        counts.skipped++;
        counts.skipReasons.provider_not_responded++;
        continue;
      }

      const providerFirstMessageTime = new Date(providerFirstMessage.created_at).getTime();
      const daysSinceProviderResponse = (now - providerFirstMessageTime) / (1000 * 60 * 60 * 24);

      // Too soon (< 9 days) or too late (> 11 days)
      if (daysSinceProviderResponse < 9) {
        counts.skipped++;
        counts.skipReasons.too_soon++;
        continue;
      }

      if (daysSinceProviderResponse > 11) {
        counts.skipped++;
        counts.skipReasons.too_late++;
        continue;
      }

      // Check if family replied AFTER provider's first message
      const familyRepliedAfterProvider = humanMessages.some(
        (m) =>
          m.from_profile_id === conn.from_profile_id &&
          new Date(m.created_at).getTime() > providerFirstMessageTime
      );

      if (familyRepliedAfterProvider) {
        counts.skipped++;
        counts.skipReasons.family_already_replied++;
        continue;
      }

      // Get family email
      let familyEmail = familyProfile?.email?.trim();
      let authEmail = familyEmail;

      if (!familyEmail && familyProfile?.account_id) {
        const { data: familyAccount } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", familyProfile.account_id)
          .single();

        if (familyAccount?.user_id) {
          const {
            data: { user: authUser },
          } = await db.auth.admin.getUserById(familyAccount.user_id);
          if (authUser?.email) {
            authEmail = authUser.email;
            familyEmail = authEmail;
          }
        }
      }

      if (!familyEmail) {
        counts.skipped++;
        counts.skipReasons.no_email++;
        continue;
      }

      const familyName = familyProfile?.display_name || "there";
      const providerName = providerProfile?.display_name || "A provider";

      // Reserve email log
      const emailLogId = await reserveEmailLogId({
        to: familyEmail,
        subject: "Need a hand with the next step?",
        emailType: "day_10_awaiting",
        recipientType: "family",
        metadata: {
          connection_id: conn.id,
          days_since_provider_response: Math.floor(daysSinceProviderResponse),
        },
      });

      // Build inbox URL (deep link to this conversation)
      const inboxPath = `/portal/inbox?id=${conn.id}`;
      const trackedInboxPath = appendTrackingParams(inboxPath, emailLogId);
      let inboxUrl = `${siteUrl}${trackedInboxPath}`;

      // Generate magic link for one-click access
      if (familyProfile?.account_id && authEmail) {
        try {
          const { data: magicLinkData, error: magicLinkError } = await db.auth.admin.generateLink({
            type: "magiclink",
            email: authEmail,
            options: {
              redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(trackedInboxPath)}`,
            },
          });
          if (!magicLinkError && magicLinkData?.properties?.action_link) {
            inboxUrl = magicLinkData.properties.action_link;
          }
        } catch (linkErr) {
          console.error("[family-day-10-awaiting] inbox magic link failed:", linkErr);
        }
      }

      // Build alternatives URL (browse providers in same area)
      const city = providerProfile?.city;
      const state = providerProfile?.state;
      const browseBase = city && state ? `/browse/${state}/${city}` : "/browse";
      const browsePath = appendTrackingParams(browseBase, emailLogId);
      let alternativesUrl = `${siteUrl}${browsePath}`;

      // Generate magic link for alternatives
      if (familyProfile?.account_id && authEmail) {
        try {
          const { data: magicLinkData, error: magicLinkError } = await db.auth.admin.generateLink({
            type: "magiclink",
            email: authEmail,
            options: {
              redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(browsePath)}`,
            },
          });
          if (!magicLinkError && magicLinkData?.properties?.action_link) {
            alternativesUrl = magicLinkData.properties.action_link;
          }
        } catch (linkErr) {
          console.error("[family-day-10-awaiting] alternatives magic link failed:", linkErr);
        }
      }

      // Support URL (mailto link - support@olera.care must be monitored)
      const supportUrl = "mailto:support@olera.care?subject=Help%20with%20next%20steps";

      // DRY RUN: Log but don't send
      if (dryRun) {
        console.log(
          `[cron/family-day-10-awaiting] [DRY RUN] Would send to ${familyEmail} (connection ${conn.id}, ${Math.floor(daysSinceProviderResponse)} days since provider response)`
        );
        counts.sent++;
        continue;
      }

      // Send email
      const { success } = await sendEmail({
        to: familyEmail,
        subject: "Need a hand with the next step?",
        html: day10AwaitingEmail({
          familyName,
          providerName,
          inboxUrl,
          supportUrl,
          alternativesUrl,
        }),
        emailType: "day_10_awaiting",
        recipientType: "family",
        emailLogId: emailLogId ?? undefined,
        recipientProfileId: familyProfile?.id,
      });

      if (!success) {
        counts.skipped++;
        counts.skipReasons.send_failed++;
        continue;
      }

      // Mark as sent
      const sentAt = new Date().toISOString();
      const { error: updateError } = await db
        .from("connections")
        .update({
          metadata: {
            ...meta,
            day_10_awaiting_sent_at: sentAt,
          },
        })
        .eq("id", conn.id);

      if (updateError) {
        console.error(
          `[cron/family-day-10-awaiting] Failed to update metadata for ${conn.id}:`,
          updateError
        );
      }

      counts.sent++;
    }

    return {
      ok: true,
      ...counts,
    };
  });
}
