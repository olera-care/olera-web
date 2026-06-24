import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { connectionOutcomeCheckEmail, careUnsubscribeUrl } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";

/**
 * GET /api/cron/family-outcome-check
 *
 * The dating-app "Did you meet this person?" check. ~48-72h after a family sends
 * an inquiry, asks them via one-click email whether the provider got back to them.
 *
 * Why: the real outcome happens off-platform (a phone call / direct email) and is
 * invisible to us — connection.status sits 'pending' forever. The family's answer
 * is our ground-truth connection signal AND the cascade trigger (a "no"/"not yet"
 * routes them to the alternative-provider + benefits mini-cascade on the landing
 * page).
 *
 * Fires strictly BEFORE family-provider-silent (96-120h) and family-never-engaged
 * (120-144h), so no same-run double-send. A recorded "yes" suppresses those later
 * negative-toned crons (guarded there).
 *
 * Eligibility:
 * - inquiry connection aged 48-72h
 * - no outcome recorded yet (metadata.outcome unset)
 * - outcome check not already sent (metadata.outcome_check_sent_at unset)
 * - provider hasn't visibly responded (no real provider message in thread)
 * - family not unsubscribed, has an email
 * - at most one outcome check per family per run
 */

export const maxDuration = 120;

const FORTY_EIGHT_H = 48 * 60 * 60 * 1000;
const SEVENTY_TWO_H = 72 * 60 * 60 * 1000;

interface ThreadMessage {
  from_profile_id: string;
  text?: string;
  is_auto_reply?: boolean;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const dryRun = searchParams.get("dry_run") === "true";
  const limit = Math.min(500, parseInt(searchParams.get("limit") || "500", 10));
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET;

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("family-outcome-check", async () => {
    const db = getServiceClient();
    const siteUrl = getSiteUrl();
    const now = Date.now();
    const seventyTwoAgo = new Date(now - SEVENTY_TWO_H).toISOString();
    const fortyEightAgo = new Date(now - FORTY_EIGHT_H).toISOString();

    const counts = {
      processed: 0,
      sent: 0,
      skipped: 0,
      skipReasons: {
        already_answered: 0,
        already_sent: 0,
        provider_responded: 0,
        unsubscribed: 0,
        no_email: 0,
        family_already_sent_this_run: 0,
        send_failed: 0,
      },
      dry_run: dryRun,
    };

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
          metadata
        ),
        to_profile:business_profiles!connections_to_profile_id_fkey(display_name)
      `,
      )
      .eq("type", "inquiry")
      .gte("created_at", seventyTwoAgo)
      .lte("created_at", fortyEightAgo)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("[cron/family-outcome-check] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!connections?.length) {
      return { ok: true, message: "No connections to process", ...counts };
    }

    // At most one outcome check per family per run.
    const familySentThisRun = new Set<string>();

    for (const conn of connections) {
      counts.processed++;
      const meta = (conn.metadata as Record<string, unknown>) || {};

      if (meta.outcome) {
        counts.skipped++;
        counts.skipReasons.already_answered++;
        continue;
      }
      if (meta.outcome_check_sent_at) {
        counts.skipped++;
        counts.skipReasons.already_sent++;
        continue;
      }

      // Provider already visibly responded → no point asking.
      const thread = (meta.thread as ThreadMessage[]) || [];
      const providerResponded = thread.some(
        (m) => m.from_profile_id === conn.to_profile_id && !m.is_auto_reply && m.text?.trim(),
      );
      if (providerResponded) {
        counts.skipped++;
        counts.skipReasons.provider_responded++;
        continue;
      }

      const fromProfile = Array.isArray(conn.from_profile) ? conn.from_profile[0] : conn.from_profile;
      const toProfile = Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile;

      const familyMeta = (fromProfile?.metadata as Record<string, unknown>) || {};
      if (familyMeta.nudges_unsubscribed) {
        counts.skipped++;
        counts.skipReasons.unsubscribed++;
        continue;
      }

      if (familySentThisRun.has(conn.from_profile_id)) {
        counts.skipped++;
        counts.skipReasons.family_already_sent_this_run++;
        continue;
      }

      // Resolve family email (fall back to auth email).
      let familyEmail = fromProfile?.email as string | undefined;
      if (!familyEmail && fromProfile?.account_id) {
        const { data: acct } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", fromProfile.account_id)
          .single();
        if (acct?.user_id) {
          const {
            data: { user: authUser },
          } = await db.auth.admin.getUserById(acct.user_id);
          if (authUser?.email) familyEmail = authUser.email;
        }
      }
      if (!familyEmail) {
        counts.skipped++;
        counts.skipReasons.no_email++;
        continue;
      }

      if (dryRun) {
        console.log(
          `[cron/family-outcome-check] [DRY RUN] Would ask ${familyEmail} about connection ${conn.id}`,
        );
        familySentThisRun.add(conn.from_profile_id);
        counts.sent++;
        continue;
      }

      const providerName = (toProfile?.display_name as string) || "the provider";
      const subject = `Did ${providerName} get back to you?`;

      const emailLogId = await reserveEmailLogId({
        to: familyEmail,
        subject,
        emailType: "family_outcome_check",
        recipientType: "family",
        metadata: { connection_id: conn.id, provider_id: conn.to_profile_id },
      });

      const link = (v: string) =>
        appendTrackingParams(`${siteUrl}/connection-outcome?cid=${conn.id}&v=${v}`, emailLogId);

      const emailHtml = connectionOutcomeCheckEmail({
        familyName: (fromProfile?.display_name as string) || "",
        providerName,
        yesUrl: link("yes"),
        notYetUrl: link("not_yet"),
        noUrl: link("no"),
        unsubscribeUrl: fromProfile?.id ? careUnsubscribeUrl(fromProfile.id as string) : undefined,
      });

      const { success, error: sendError } = await sendEmail({
        to: familyEmail,
        subject,
        html: emailHtml,
        emailType: "family_outcome_check",
        recipientType: "family",
        metadata: { connection_id: conn.id, provider_id: conn.to_profile_id },
        emailLogId: emailLogId ?? undefined,
      });

      if (!success) {
        console.error(`[cron/family-outcome-check] Send failed for connection ${conn.id}:`, sendError);
        counts.skipped++;
        counts.skipReasons.send_failed++;
        continue;
      }

      // Stamp AFTER successful send (no lockout on failure).
      await db
        .from("connections")
        .update({
          metadata: {
            ...meta,
            outcome_check_sent_at: new Date().toISOString(),
            outcome_check_sent_by: "cron:family-outcome-check",
          },
        })
        .eq("id", conn.id);

      familySentThisRun.add(conn.from_profile_id);
      counts.sent++;
    }

    return { ok: true, ...counts };
  });
}
