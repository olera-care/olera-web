import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { familyPendingReachOutNudgeEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";

/**
 * GET /api/cron/matches-family-nudge
 *
 * Runs daily at 3 PM UTC. Nudges families who haven't responded to provider
 * reach-outs via Matches.
 *
 * Criteria:
 * - Connection type is 'request' (provider-initiated)
 * - Status is 'pending' (family hasn't accepted/declined)
 * - Created 3+ days ago
 * - Family HAS an email address
 * - Family was NOT nudged in the last 7 days (checked per connection)
 */
export const maxDuration = 120;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

  return withCronRun("matches-family-nudge", async () => {
    const db = getServiceClient();
    const siteUrl = getSiteUrl();
    const now = Date.now();
    const threeDaysAgo = new Date(now - THREE_DAYS_MS).toISOString();

    const counts = {
      connections_processed: 0,
      families_nudged: 0,
      skipped: 0,
      skipReasons: {
        no_email: 0,
        recently_nudged: 0,
        send_failed: 0,
      },
      dry_run: dryRun,
    };

    // Fetch pending reach-outs that are at least 3 days old
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
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name, city, state),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, email, account_id, claim_token)
      `
      )
      .eq("type", "request")
      .eq("status", "pending")
      .lte("created_at", threeDaysAgo)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("[cron/matches-family-nudge] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!connections?.length) {
      return {
        ok: true,
        message: "No pending reach-outs to process",
        ...counts,
      };
    }

    for (const conn of connections) {
      counts.connections_processed++;

      // Normalize joined relations
      const fromProfile = Array.isArray(conn.from_profile)
        ? conn.from_profile[0]
        : conn.from_profile;
      const toProfile = Array.isArray(conn.to_profile)
        ? conn.to_profile[0]
        : conn.to_profile;

      const meta = (conn.metadata as Record<string, unknown>) ?? {};

      // Check cooldown (7 days per connection)
      const lastNudgedAt = meta.family_reach_out_nudged_at as string | undefined;
      if (lastNudgedAt) {
        const timeSinceNudge = now - new Date(lastNudgedAt).getTime();
        if (timeSinceNudge < SEVEN_DAYS_MS) {
          counts.skipped++;
          counts.skipReasons.recently_nudged++;
          continue;
        }
      }

      // Get family email
      let familyEmail = toProfile?.email?.trim();

      // If no email on profile but has account, try to get from auth
      if (!familyEmail && toProfile?.account_id) {
        const { data: familyAccount } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", toProfile.account_id)
          .single();

        if (familyAccount?.user_id) {
          const { data: { user: authUser } } = await db.auth.admin.getUserById(familyAccount.user_id);
          familyEmail = authUser?.email;
        }
      }

      if (!familyEmail) {
        counts.skipped++;
        counts.skipReasons.no_email++;
        continue;
      }

      const providerName = fromProfile?.display_name || "A care provider";
      const providerCity = fromProfile?.city || fromProfile?.state || "your area";
      const familyName = toProfile?.display_name || "there";

      // Calculate days since reach-out
      const daysSinceReachOut = Math.floor(
        (now - new Date(conn.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dryRun) {
        console.log(
          `[cron/matches-family-nudge] [DRY RUN] Would nudge ${familyEmail} about ${providerName}'s reach-out (${daysSinceReachOut} days ago)`
        );
        counts.families_nudged++;
        continue;
      }

      // Reserve email log ID
      const emailLogId = await reserveEmailLogId({
        to: familyEmail,
        subject: `${providerName} is waiting to hear from you`,
        emailType: "family_reach_out_nudge",
        recipientType: "family",
        metadata: {
          connection_id: conn.id,
          nudged_by: "cron:matches-family-nudge",
          days_since_reach_out: daysSinceReachOut,
        },
      });

      // Build inbox URL with connection ID for auto-selection
      const inboxPath = `/portal/inbox?id=${conn.id}`;
      const trackedDest = appendTrackingParams(inboxPath, emailLogId);
      let viewUrl = `${siteUrl}${trackedDest}`;

      // Generate magic link for authenticated families
      if (toProfile?.account_id) {
        try {
          const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
            type: "magiclink",
            email: familyEmail,
            options: {
              redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(trackedDest)}`,
            },
          });

          if (!linkError && linkData?.properties?.action_link) {
            viewUrl = linkData.properties.action_link;
          }
        } catch (linkErr) {
          console.error("[cron/matches-family-nudge] Magic link failed:", linkErr);
          // Continue with fallback URL
        }
      } else if (toProfile?.claim_token) {
        // Guest family: include claim token
        const separator = trackedDest.includes("?") ? "&" : "?";
        viewUrl = `${siteUrl}${trackedDest}${separator}token=${toProfile.claim_token}`;
      }

      // Send email
      const { success, error: sendError } = await sendEmail({
        to: familyEmail,
        subject: `${providerName} is waiting to hear from you`,
        html: familyPendingReachOutNudgeEmail({
          familyName,
          providerName,
          providerCity,
          messagePreview: conn.message || null,
          daysSinceReachOut,
          viewUrl,
        }),
        emailType: "family_reach_out_nudge",
        recipientType: "family",
        metadata: {
          connection_id: conn.id,
          nudged_by: "cron:matches-family-nudge",
        },
        emailLogId: emailLogId ?? undefined,
        recipientProfileId: toProfile?.id,
      });

      if (!success) {
        console.error(
          `[cron/matches-family-nudge] Send failed for ${conn.id}:`,
          sendError
        );
        counts.skipped++;
        counts.skipReasons.send_failed++;
        continue;
      }

      // Update metadata to track nudge
      const nudgedAt = new Date().toISOString();
      const { error: updateError } = await db
        .from("connections")
        .update({
          metadata: {
            ...meta,
            family_reach_out_nudged_at: nudgedAt,
            family_reach_out_nudged_by: "cron:matches-family-nudge",
            family_reach_out_nudge_count: ((meta.family_reach_out_nudge_count as number) || 0) + 1,
          },
        })
        .eq("id", conn.id);

      if (updateError) {
        console.error(
          `[cron/matches-family-nudge] Failed to update metadata for ${conn.id}:`,
          updateError
        );
      }

      counts.families_nudged++;
      console.log(
        `[cron/matches-family-nudge] Nudged ${familyEmail} about ${providerName}'s reach-out`
      );
    }

    return {
      ok: true,
      ...counts,
    };
  });
}
