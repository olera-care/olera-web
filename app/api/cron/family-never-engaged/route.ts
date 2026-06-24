import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { familyNeverEngagedEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";
import { generateFamilyInboxUrl } from "@/lib/claim-tokens";

/**
 * GET /api/cron/family-never-engaged
 *
 * Runs daily. Sends Email #5 to families who NEVER engaged after Day 5.
 * Guide-first, gentle re-engagement with zero pressure.
 *
 * Trigger conditions:
 * - Connection is 5-6 days old (120-144 hours)
 * - Family has NEVER sent a message in ANY connection (zero engagement)
 * - Provider has NOT responded (connection still silent)
 * - Email not already sent (family_never_engaged_sent_at not set)
 * - Send ONCE per FAMILY (not per connection)
 *
 * Family-level intelligence:
 * - Groups connections by family (from_profile_id)
 * - Checks ALL connections for that family
 * - If family has engaged ANYWHERE, skip entirely
 * - If multiple never-engaged connections exist, send ONE email
 * - Marks ALL never-engaged connections for that family
 *
 * Mutual exclusivity with Email #4:
 * - Email #4 fires if family engaged but provider silent
 * - Email #5 fires if family NEVER engaged
 * - These two scenarios never overlap
 */

export const maxDuration = 120;

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;

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

  return withCronRun("family-never-engaged", async () => {
    const db = getServiceClient();
    const siteUrl = getSiteUrl();
    const now = Date.now();
    const fiveDaysAgo = new Date(now - FIVE_DAYS_MS).toISOString();
    const sixDaysAgo = new Date(now - SIX_DAYS_MS).toISOString();

    const counts = {
      processed: 0,
      sent: 0,
      skipped: 0,
      skipReasons: {
        family_engaged_elsewhere: 0,
        provider_responded: 0,
        already_sent: 0,
        no_email: 0,
        send_failed: 0,
        outcome_connected: 0,
      },
      dry_run: dryRun,
    };

    // Fetch connections that are 5-6 days old (inquiry type only)
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
          account_id
        ),
        to_profile:business_profiles!connections_to_profile_id_fkey(
          display_name
        )
      `
      )
      .eq("type", "inquiry")
      .gte("created_at", sixDaysAgo)
      .lte("created_at", fiveDaysAgo)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("[cron/family-never-engaged] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!connections?.length) {
      return {
        ok: true,
        message: "No connections to process",
        ...counts,
      };
    }

    // Group connections by family to prevent duplicate emails
    // Key: from_profile_id, Value: connection[]
    const connectionsByFamily = new Map<string, typeof connections>();
    for (const conn of connections) {
      const familyId = conn.from_profile_id;
      if (!connectionsByFamily.has(familyId)) {
        connectionsByFamily.set(familyId, []);
      }
      connectionsByFamily.get(familyId)!.push(conn);
    }

    // Process each FAMILY (not each connection)
    for (const [familyId, familyConnections] of connectionsByFamily) {
      counts.processed++;

      // Check if family has EVER engaged in ANY connection (including ones outside this batch)
      // We need to check ALL connections for this family, not just the ones in the 5-6 day window
      const { data: allFamilyConnections, error: familyConnError } = await db
        .from("connections")
        .select("id, from_profile_id, to_profile_id, metadata")
        .eq("from_profile_id", familyId);

      if (familyConnError) {
        console.error(
          "[cron/family-never-engaged] Error checking family engagement:",
          familyConnError
        );
        counts.skipped++;
        continue;
      }

      // BUG FIX #1: Check if Email #5 was already sent to this family
      // Check ALL connections (not just current batch) to prevent duplicate emails
      let alreadySent = false;
      if (allFamilyConnections) {
        alreadySent = allFamilyConnections.some((conn) => {
          const meta = (conn.metadata || {}) as Record<string, unknown>;
          return meta.family_never_engaged_sent_at;
        });
      }

      if (alreadySent) {
        counts.skipped++;
        counts.skipReasons.already_sent++;
        continue;
      }

      // Suppress if the family already self-reported (outcome-check) that the
      // provider DID get back to them — don't contradict their own answer.
      const familySaidConnected = (allFamilyConnections || []).some((conn) => {
        const m = (conn.metadata || {}) as Record<string, unknown>;
        return (m.outcome as { value?: string } | undefined)?.value === "yes";
      });
      if (familySaidConnected) {
        counts.skipped++;
        counts.skipReasons.outcome_connected++;
        continue;
      }

      // BUG FIX #2: Check if family engaged OR if ANY provider responded
      // If family has active conversations anywhere, skip the re-engagement email
      let familyHasEngaged = false;
      let anyProviderResponded = false;

      if (allFamilyConnections) {
        for (const conn of allFamilyConnections) {
          const meta = (conn.metadata || {}) as Record<string, unknown>;
          const thread = (meta.thread as ThreadMessage[]) || [];

          // Check if family sent a message
          const familySentMessage = thread.some(
            (m) =>
              m.from_profile_id === conn.from_profile_id &&
              !m.is_auto_reply &&
              m.text?.trim()
          );
          if (familySentMessage) {
            familyHasEngaged = true;
            break; // Family is engaged, no need to check further
          }

          // Check if ANY provider responded
          const providerResponded = thread.some(
            (m) =>
              m.from_profile_id === conn.to_profile_id &&
              !m.is_auto_reply &&
              m.text?.trim()
          );
          if (providerResponded) {
            anyProviderResponded = true;
            // Don't break - still need to check if family engaged elsewhere
          }
        }
      }

      if (familyHasEngaged) {
        counts.skipped++;
        counts.skipReasons.family_engaged_elsewhere++;
        continue;
      }

      if (anyProviderResponded) {
        counts.skipped++;
        counts.skipReasons.provider_responded++;
        continue;
      }

      // Pick the FIRST connection for this family (oldest) to use for email context
      // We'll send ONE email about this connection, but mark ALL never-engaged connections
      const primaryConn = familyConnections[0];

      // Get family email (need to resolve auth email for magic link)
      const fromProfile = Array.isArray(primaryConn.from_profile)
        ? primaryConn.from_profile[0]
        : primaryConn.from_profile;
      const toProfile = Array.isArray(primaryConn.to_profile)
        ? primaryConn.to_profile[0]
        : primaryConn.to_profile;

      let familyEmail = fromProfile?.email;
      let authEmail = familyEmail;

      if (fromProfile?.account_id) {
        const { data: acct } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", fromProfile.account_id)
          .single();
        if (acct?.user_id) {
          const { data: { user: authUser } } = await db.auth.admin.getUserById(acct.user_id);
          if (authUser?.email) {
            authEmail = authUser.email;
            if (!familyEmail) familyEmail = authEmail;
          }
        }
      }

      if (!familyEmail) {
        counts.skipped++;
        counts.skipReasons.no_email++;
        continue;
      }

      const familyName = fromProfile?.display_name || "";
      const providerName = toProfile?.display_name || "the provider";

      // Subject line
      const subject = "A quick resource while you're thinking things over";

      // Reserve email log ID
      const emailLogId = await reserveEmailLogId({
        to: familyEmail,
        subject,
        emailType: "family_never_engaged",
        recipientType: "family",
        metadata: {
          connection_id: primaryConn.id,
          family_connection_count: familyConnections.length,
        },
      });

      // Build guide URL (direct PDF link) with tracking
      const guideDest = appendTrackingParams(
        "/olera-senior-care-guide-one-page.pdf",
        emailLogId
      );
      const guideUrl = `${siteUrl}${guideDest}`;

      // Build inbox URL with tracking
      const inboxDest = appendTrackingParams("/portal/inbox", emailLogId);

      // Generate HMAC token URL for inbox (72-hour expiry, more reliable than Supabase magic links)
      const inboxMagicLink = generateFamilyInboxUrl(authEmail, inboxDest, siteUrl);

      // BUG FIX #3: Check dry run BEFORE mutating database
      if (dryRun) {
        console.log(
          `[cron/family-never-engaged] [DRY RUN] Would send to ${familyEmail} for family ${familyId} with ${familyConnections.length} connections`
        );
        counts.sent++;
        continue;
      }

      // Mark ALL never-engaged connections for this family BEFORE sending (transaction safety)
      const sentAt = new Date().toISOString();
      for (const conn of familyConnections) {
        const connMeta = (conn.metadata || {}) as Record<string, unknown>;
        await db
          .from("connections")
          .update({
            metadata: {
              ...connMeta,
              family_never_engaged_sent_at: sentAt,
              family_never_engaged_sent_by: "cron:family-never-engaged",
            },
          })
          .eq("id", conn.id);
      }

      // Generate email HTML
      const emailHtml = familyNeverEngagedEmail({
        familyName,
        providerName,
        guideUrl, // Direct PDF link (no magic link needed)
        inboxUrl: inboxMagicLink, // Magic link for authenticated inbox access
      });

      // Send email
      const { success, error: sendError } = await sendEmail({
        to: familyEmail,
        subject,
        html: emailHtml,
        emailType: "family_never_engaged",
        recipientType: "family",
        metadata: {
          connection_id: primaryConn.id,
          family_connection_count: familyConnections.length,
        },
        emailLogId: emailLogId ?? undefined,
      });

      if (!success) {
        console.error(
          `[cron/family-never-engaged] Send failed for family ${familyId}:`,
          sendError
        );
        counts.skipped++;
        counts.skipReasons.send_failed++;
        continue;
      }

      // Metadata already updated before sending (for transaction safety)
      counts.sent++;
    }

    return {
      ok: true,
      ...counts,
    };
  });
}
