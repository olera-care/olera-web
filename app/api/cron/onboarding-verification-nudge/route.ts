import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId } from "@/lib/email";
import { onboardingVerificationEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { stateToTimezone } from "@/lib/sms/quiet-hours";
import { generateProviderPortalUrl } from "@/lib/claim-tokens";

const FALLBACK_TZ = "America/New_York";
const SEND_START = 9;
const SEND_END = 17;

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
 * GET /api/cron/onboarding-verification-nudge
 *
 * Onboarding Email 1. Runs hourly. Sends a verification nudge to providers
 * 24h after their welcome email.
 *
 * Skip conditions:
 * - Provider is already verified or verification_state = 'not_required'
 * - Already received this nudge (metadata.verification_nudge_sent)
 * - Welcome email was sent less than 24h ago
 * - Outside business hours (Mon-Fri 9am-5pm provider local time)
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

  return withCronRun("onboarding-verification-nudge", async () => {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    const counts = { sent: 0, skipped: 0, errors: 0 };

    // Fetch claimed providers who have received the welcome email
    const { data: providers, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, account_id, state, verification_state")
      .in("type", ["organization", "caregiver"])
      .not("account_id", "is", null)
      .gte("created_at", thirtyDaysAgo)
      .limit(200);

    if (fetchError) {
      console.error("[cron/onboarding-verification-nudge] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!providers?.length) {
      return { status: "ok", message: "No providers needing verification nudge", dry_run: dryRun, ...counts };
    }

    // Resolve emails from accounts
    const accountIds = providers
      .filter((p) => !p.email && p.account_id)
      .map((p) => p.account_id);

    let accountEmailMap: Record<string, { email: string; name: string }> = {};
    if (accountIds.length > 0) {
      const { data: accounts } = await db
        .from("accounts")
        .select("id, user_id")
        .in("id", accountIds);

      if (accounts?.length) {
        const { data: { users } } = await db.auth.admin.listUsers({ perPage: 500 });

        const userDataMap: Record<string, { email: string; name: string }> = {};
        for (const u of users || []) {
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

      // Must have received the welcome email
      if (!meta.welcome_email_sent) { counts.skipped++; continue; }

      // Skip if already sent
      if (meta.verification_nudge_sent) { counts.skipped++; continue; }

      // Skip if admin-archived
      if (meta.admin_archived === true) { counts.skipped++; continue; }

      // Skip if already verified
      const vs = provider.verification_state as string | null;
      if (vs === "verified" || vs === "not_required") { counts.skipped++; continue; }

      // Must be at least 24h since the welcome email
      const welcomeSentAt = meta.welcome_email_sent_at as string | undefined;
      const welcomeTs = welcomeSentAt ? new Date(welcomeSentAt).getTime() : 0;
      const hoursSinceWelcome = welcomeTs ? (now - welcomeTs) / (60 * 60 * 1000) : Infinity;
      if (hoursSinceWelcome < 24) { counts.skipped++; continue; }

      // Business hours only
      if (!isBusinessHours(new Date(now), provider.state)) { counts.skipped++; continue; }

      // Resolve email
      let email = provider.email;
      let recipientName = meta.verification_submission
        ? (meta.verification_submission as Record<string, unknown>).name as string
        : provider.display_name || "there";

      if (!email && provider.account_id && accountEmailMap[provider.account_id]) {
        email = accountEmailMap[provider.account_id].email;
        if (!recipientName || recipientName === "there") {
          recipientName = accountEmailMap[provider.account_id].name;
        }
      }
      if (!email) { counts.skipped++; continue; }

      const providerName = provider.display_name || "your Olera page";

      try {
        if (!dryRun) {
          const subject = "Earn your Olera trust badge";

          const emailLogId = await reserveEmailLogId({
            to: email,
            subject,
            emailType: "onboarding_verification_nudge",
            recipientType: "provider",
            providerId: provider.id,
          });

          // HMAC token link (15-day expiry) for one-click sign-in → verification modal
          const verifyUrl = generateProviderPortalUrl(provider.slug, email, "verify", siteUrl);

          await sendEmail({
            to: email,
            subject,
            html: onboardingVerificationEmail({
              providerName,
              recipientName,
              verifyUrl,
              providerSlug: provider.slug,
            }),
            emailType: "onboarding_verification_nudge",
            recipientType: "provider",
            providerId: provider.id,
            emailLogId: emailLogId ?? undefined,
            recipientProfileId: provider.id,
          });

          await db
            .from("business_profiles")
            .update({
              metadata: {
                ...meta,
                verification_nudge_sent: true,
                verification_nudge_sent_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", provider.id);
        }

        console.log(`[cron/onboarding-verification-nudge] ${dryRun ? "[DRY RUN] " : ""}Sent to: ${providerName} (${email})`);
        counts.sent++;
      } catch (err) {
        console.error(`[cron/onboarding-verification-nudge] Error for ${provider.id}:`, err);
        counts.errors++;
      }
    }

    return { status: "ok", dry_run: dryRun, processed: providers.length, ...counts };
  });
}
