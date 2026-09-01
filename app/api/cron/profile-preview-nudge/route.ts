import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId } from "@/lib/email";
import { onboardingProfilePreviewEmail, onboardingProfilePreviewSubject } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { stateToTimezone } from "@/lib/sms/quiet-hours";
import { generateProviderPortalUrl } from "@/lib/claim-tokens";
import { ONBOARDING_PREVIEW_DELAY_HOURS, loadActiveSeekers, countSeekersNear } from "@/lib/crons/onboarding";

const FALLBACK_TZ = "America/New_York";
const SEND_START = 9;
const SEND_END = 17;

/** How far back to look. Comfortably wider than the delay so nobody is stranded. */
const LOOKBACK_DAYS = 21;

/** Runaway guard, not a pagination scheme — the metadata filter keeps the set small. */
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
  if (parts.weekday === "Sat" || parts.weekday === "Sun") return false;
  return hour >= SEND_START && hour < SEND_END;
}

/**
 * GET /api/cron/profile-preview-nudge
 *
 * Onboarding Email 1. Runs hourly. Shows a provider what families see on their
 * page, and asks them to fill the gaps.
 *
 * Anchored on welcome_email_sent_at, NOT on a verification flag. The original
 * design chained each email to the previous one's flag, but only ~11% of claimed
 * providers are unverified, so the verification email almost never sends and its
 * flag was being stamped by skip logic just to keep the chain moving. That made
 * the whole sequence depend on an email that mostly does not go out, and it put
 * the two cohorts on different schedules. One anchor, one schedule.
 *
 * Eligibility:
 * - received the welcome email at least ONBOARDING_PREVIEW_DELAY_HOURS ago
 * - has not already received this email
 * - not admin-archived, has an email address
 * - Mon-Fri 9am-5pm in the provider's timezone
 *
 * Both the "welcomed" and "not yet previewed" tests run in the query so the row
 * cap can only truncate genuinely-eligible providers, and the ordering makes
 * which ones deterministic.
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

  return withCronRun("profile-preview-nudge", async () => {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = Date.now();
    const lookbackFrom = new Date(now - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const counts = {
      sent: 0,
      skippedTooSoon: 0,
      skippedOutsideHours: 0,
      skippedArchived: 0,
      skippedNoEmail: 0,
      skippedSuppressed: 0,
      errors: 0,
      withLocalDemand: 0,
      withoutLocalDemand: 0,
    };

    const { data: providers, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, account_id, state, city, lat, lng")
      .in("type", ["organization", "caregiver"])
      .not("account_id", "is", null)
      .gte("claimed_at", lookbackFrom)
      .not("metadata->>welcome_email_sent_at", "is", null)
      .is("metadata->>profile_preview_nudge_sent", null)
      .order("claimed_at", { ascending: true })
      .limit(MAX_PER_RUN);

    if (fetchError) {
      console.error("[cron/profile-preview-nudge] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!providers?.length) {
      return { status: "ok", message: "No providers needing a profile preview", dry_run: dryRun, ...counts };
    }

    // Measured once per run and reused. Only ~189 families have a live care
    // post platform-wide, so this is a small read, and it decides whether this
    // email is allowed to claim local demand at all.
    const seekers = await loadActiveSeekers(db);

    if (providers.length === MAX_PER_RUN) {
      console.warn(
        `[cron/profile-preview-nudge] Hit the ${MAX_PER_RUN}-row cap. Remaining providers roll to the next hour.`,
      );
    }

    for (const provider of providers) {
      const meta = (provider.metadata || {}) as Record<string, unknown>;

      if (meta.admin_archived === true) { counts.skippedArchived++; continue; }

      const welcomeAt = meta.welcome_email_sent_at as string | undefined;
      const welcomeTs = welcomeAt ? Date.parse(welcomeAt) : NaN;
      // A malformed timestamp must not fast-track the email. Treat it as too soon.
      if (!Number.isFinite(welcomeTs)) { counts.skippedTooSoon++; continue; }
      if ((now - welcomeTs) / (60 * 60 * 1000) < ONBOARDING_PREVIEW_DELAY_HOURS) {
        counts.skippedTooSoon++;
        continue;
      }

      if (!isBusinessHours(new Date(now), provider.state)) { counts.skippedOutsideHours++; continue; }

      const email = provider.email;
      if (!email) { counts.skippedNoEmail++; continue; }

      const providerName = provider.display_name || "your organization";

      try {
        // Never assert demand we have not counted. Most providers correctly
        // get the neutral opening because their market genuinely is quiet.
        // Computed BEFORE the dry-run branch: the whole point of a dry run here
        // is to see which opening each provider would get.
        const nearbySeekers = countSeekersNear(seekers, provider);
        const cityLabel = provider.city || provider.state || "your area";
        const subject = onboardingProfilePreviewSubject({ providerName, city: cityLabel, nearbySeekers });

        if (nearbySeekers > 0) counts.withLocalDemand++; else counts.withoutLocalDemand++;

        if (dryRun) {
          console.log(`[cron/profile-preview-nudge] [DRY RUN] ${providerName} (${email}) — ${nearbySeekers} nearby seeker(s) — "${subject}"`);
          counts.sent++;
          continue;
        }

        const emailLogId = await reserveEmailLogId({
          to: email,
          subject,
          emailType: "profile_preview_nudge",
          recipientType: "provider",
          providerId: provider.id,
        });

        // HMAC claim token, 15-day expiry, signs them in and lands on their own
        // PUBLIC page — the view a family gets.
        const profileUrl = generateProviderPortalUrl(provider.slug, email, "profile", siteUrl);

        const result = await sendEmail({
          to: email,
          subject,
          html: onboardingProfilePreviewEmail({
            providerName,
            city: cityLabel,
            profileUrl,
            nearbySeekers,
            providerSlug: provider.slug,
          }),
          emailType: "profile_preview_nudge",
          recipientType: "provider",
          providerId: provider.id,
          emailLogId: emailLogId ?? undefined,
          recipientProfileId: provider.id,
        });

        // sendEmail RETURNS failures, it does not throw. Leave a failed send
        // unflagged so the next run retries it.
        if (!result.success) {
          console.error(
            `[cron/profile-preview-nudge] Send failed for ${provider.id} (${providerName}): ${result.error}. Left unflagged for retry.`,
          );
          counts.errors++;
          continue;
        }

        const suppressed = result.skipped === true;
        if (suppressed) {
          console.log(
            `[cron/profile-preview-nudge] Suppressed for ${provider.id} (${providerName}): ${result.skipReason}. Flagging so it is not retried.`,
          );
        }

        const { error: stampError } = await db
          .from("business_profiles")
          .update({
            metadata: {
              ...meta,
              profile_preview_nudge_sent: true,
              profile_preview_nudge_sent_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", provider.id);

        if (stampError) {
          console.error(
            `[cron/profile-preview-nudge] SENT but failed to stamp ${provider.id} (${providerName}): ${stampError.message}. Will re-send next run until the write succeeds.`,
          );
          counts.errors++;
          continue;
        }

        if (suppressed) {
          counts.skippedSuppressed++;
        } else {
          console.log(`[cron/profile-preview-nudge] Sent to: ${providerName} (${email}) — ${nearbySeekers} nearby seeker(s)`);
          counts.sent++;
        }
      } catch (err) {
        console.error(`[cron/profile-preview-nudge] Error for ${provider.id}:`, err);
        counts.errors++;
      }
    }

    return { status: "ok", dry_run: dryRun, processed: providers.length, ...counts };
  });
}
