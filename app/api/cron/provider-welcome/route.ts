import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId } from "@/lib/email";
import { providerWelcomeEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { stateToTimezone } from "@/lib/sms/quiet-hours";
import { generateProviderPortalUrl } from "@/lib/claim-tokens";

const FALLBACK_TZ = "America/New_York";
const SEND_START = 9;  // 9am local
const SEND_END = 17;   // 5pm local (exclusive)

/** How far back to look for unwelcomed claims. Covers weekends and any missed runs. */
const LOOKBACK_DAYS = 7;

/** Hard ceiling per run. With ~30 claims a week this is never reached; it is a
 *  runaway guard, not a pagination scheme. The metadata filter below is what
 *  keeps the working set small, so an already-welcomed provider never occupies
 *  a slot. */
const MAX_PER_RUN = 200;

/** Mon-Fri, 9am-5pm in the provider's local timezone. */
function isBusinessHours(now: Date, state?: string | null): boolean {
  const tz = stateToTimezone(state) ?? FALLBACK_TZ;
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    weekday: "short",
    hour: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(now)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const weekday = parts.weekday;

  if (weekday === "Sat" || weekday === "Sun") return false;
  return hour >= SEND_START && hour < SEND_END;
}

/**
 * GET /api/cron/provider-welcome
 *
 * Onboarding Email 0. Runs hourly. Sends one welcome email to providers who
 * recently claimed their page. This is the first (and currently only) email in
 * the onboarding sequence.
 *
 * Eligibility:
 * - type is organization or caregiver, with an account_id (a real claim)
 * - claimed_at within the last 7 days
 * - metadata.welcome_email_sent is not set
 * - not admin-archived
 * - current time is Mon-Fri 9am-5pm in the provider's timezone
 *
 * Two details that previously went wrong and are load-bearing here:
 *
 * 1. The window is on claimed_at, NOT created_at. Claiming an existing listing
 *    UPDATES its business_profiles row rather than inserting one, so created_at
 *    is the row's birthday and can predate the claim by months. Measured against
 *    production, ~6% of claims sit on rows older than 7 days and a created_at
 *    window never sees them.
 *
 * 2. The metadata flag is filtered SERVER-SIDE. Filtering it in JS after a
 *    .limit() means already-welcomed providers consume slots and new ones get
 *    silently dropped once the cohort outgrows the limit. That is the exact
 *    failure that left provider_incomplete_profile sending nothing for months.
 *
 * On send: sets lifecycle_stage = 'onboarding'. The flag write is checked, so a
 * failed update never counts as a send. If it did, the provider would have no
 * flag on the next hourly run and would be emailed again, every hour.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const dryRun = searchParams.get("dry_run") === "true";
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("provider-welcome", async () => {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = Date.now();
    const lookbackFrom = new Date(now - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const counts = {
      sent: 0,
      skippedOutsideHours: 0,
      skippedArchived: 0,
      skippedNoEmail: 0,
      skippedSuppressed: 0,
      errors: 0,
    };

    // Providers who claimed recently and have not been welcomed. Both the recency
    // window and the "not yet welcomed" test run in the query so the row cap can
    // only ever truncate genuinely-eligible providers, and the ordering makes
    // which ones deterministic (oldest claim first) instead of arbitrary.
    const { data: providers, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, account_id, state, verification_state")
      .in("type", ["organization", "caregiver"])
      .not("account_id", "is", null)
      .gte("claimed_at", lookbackFrom)
      .is("metadata->>welcome_email_sent", null)
      .order("claimed_at", { ascending: true })
      .limit(MAX_PER_RUN);

    if (fetchError) {
      console.error("[cron/provider-welcome] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!providers?.length) {
      return { status: "ok", message: "No providers needing a welcome email", dry_run: dryRun, ...counts };
    }

    if (providers.length === MAX_PER_RUN) {
      console.warn(
        `[cron/provider-welcome] Hit the ${MAX_PER_RUN}-row cap. More providers are waiting than one run can send; they will be picked up next hour, but check why the claim rate jumped.`,
      );
    }

    // business_profiles.email is synced from the claimer's verified address at
    // claim time, so it is set for every current claim. Fall back to the auth
    // user only if that ever stops being true.
    const accountIds = providers
      .filter((p) => !p.email && p.account_id)
      .map((p) => p.account_id as string);

    const accountEmailMap: Record<string, { email: string; name: string }> = {};
    if (accountIds.length > 0) {
      const { data: accounts } = await db
        .from("accounts")
        .select("id, user_id")
        .in("id", accountIds);

      if (accounts?.length) {
        const { data: userData } = await db.auth.admin.listUsers({ perPage: 500 });
        const userDataMap: Record<string, { email: string; name: string }> = {};
        for (const u of userData?.users || []) {
          if (u.id && u.email) {
            userDataMap[u.id] = {
              email: u.email,
              name: (u.user_metadata?.full_name as string) || u.email.split("@")[0],
            };
          }
        }
        for (const acct of accounts) {
          if (acct.user_id && userDataMap[acct.user_id]) {
            accountEmailMap[acct.id] = userDataMap[acct.user_id];
          }
        }
      }
    }

    for (const provider of providers) {
      const meta = (provider.metadata || {}) as Record<string, unknown>;

      if (meta.admin_archived === true) { counts.skippedArchived++; continue; }

      // Business hours only. Skipping is safe: the 7-day window means the next
      // qualifying run picks them back up.
      if (!isBusinessHours(new Date(now), provider.state)) { counts.skippedOutsideHours++; continue; }

      let email = provider.email;
      if (!email && provider.account_id && accountEmailMap[provider.account_id]) {
        email = accountEmailMap[provider.account_id].email;
      }
      if (!email) { counts.skippedNoEmail++; continue; }

      const providerName = provider.display_name || "your organization";

      // Verification gates family details in Matches and the portal inbox, so a
      // provider who still needs it gets the ask folded into this email rather
      // than a promise the product will not honor. Mirror the product's own gate
      // (app/provider/matches/page.tsx) rather than testing for "unverified":
      // a claim starts as not_required or unverified, but can move to pending or
      // rejected inside the 7-day window, and those states are gated too.
      const vs = provider.verification_state;
      const hasFullAccess = vs === "verified" || vs === "not_required";
      const needsVerification = !hasFullAccess;

      try {
        if (dryRun) {
          console.log(`[cron/provider-welcome] [DRY RUN] Would send to: ${providerName} (${email})`);
          counts.sent++;
          continue;
        }

        const subject = `${providerName} is now yours to manage`;

        const emailLogId = await reserveEmailLogId({
          to: email,
          subject,
          emailType: "provider_welcome",
          recipientType: "provider",
          providerId: provider.id,
        });

        // HMAC claim token, 15-day expiry, one click into the dashboard.
        const dashboardUrl = generateProviderPortalUrl(provider.slug, email, "manage", siteUrl);
        const verifyUrl = needsVerification
          ? generateProviderPortalUrl(provider.slug, email, "settings", siteUrl)
          : undefined;

        const result = await sendEmail({
          to: email,
          subject,
          html: providerWelcomeEmail({
            providerName,
            dashboardUrl,
            verifyUrl,
            providerSlug: provider.slug,
          }),
          emailType: "provider_welcome",
          recipientType: "provider",
          providerId: provider.id,
          emailLogId: emailLogId ?? undefined,
          recipientProfileId: provider.id,
        });

        // sendEmail RETURNS failures, it does not throw. Stamping without
        // checking would mark a provider as welcomed when nothing was
        // delivered, and the 7-day window would then close over them
        // permanently. Leave them unflagged so the next run retries.
        if (!result.success) {
          console.error(
            `[cron/provider-welcome] Send failed for ${provider.id} (${providerName}): ${result.error}. Left unflagged for retry.`,
          );
          counts.errors++;
          continue;
        }

        // A deliberate suppression (do-not-contact, bounce, prefs) is not a
        // failure. Stamp it so we stop reconsidering them every hour, but do
        // not report it as a send.
        const suppressed = result.skipped === true;
        if (suppressed) {
          console.log(
            `[cron/provider-welcome] Suppressed for ${provider.id} (${providerName}): ${result.skipReason}. Flagging so it is not retried.`,
          );
        }

        // Stamp the flag and the stage. If this write fails the email has already
        // gone out, so treat it as an error rather than a send: counting it as a
        // send would hide a provider who is now unflagged and will be emailed
        // again on the next run.
        const { error: stampError } = await db
          .from("business_profiles")
          .update({
            lifecycle_stage: "onboarding",
            metadata: {
              ...meta,
              welcome_email_sent: true,
              welcome_email_sent_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", provider.id);

        if (stampError) {
          console.error(
            `[cron/provider-welcome] SENT but failed to stamp ${provider.id} (${providerName}): ${stampError.message}. This provider will be re-sent next run until the write succeeds.`,
          );
          counts.errors++;
          continue;
        }

        if (suppressed) {
          counts.skippedSuppressed++;
        } else {
          console.log(`[cron/provider-welcome] Sent to: ${providerName} (${email})`);
          counts.sent++;
        }
      } catch (err) {
        console.error(`[cron/provider-welcome] Error for ${provider.id}:`, err);
        counts.errors++;
      }
    }

    return { status: "ok", dry_run: dryRun, processed: providers.length, ...counts };
  });
}
