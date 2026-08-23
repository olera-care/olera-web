import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId } from "@/lib/email";
import { onboardingProfilePreviewEmail } from "@/lib/email-templates";
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
 * GET /api/cron/profile-preview-nudge
 *
 * Onboarding Email 2. Runs daily. Sends a "see what families see" email to
 * providers who:
 *  1. Have claimed their listing
 *  2. Have passed through the verification step (verification_nudge_sent flag)
 *  3. Haven't already received this email (metadata.profile_preview_nudge_sent)
 *  4. Verification step was processed at least 48h ago
 *  5. Current time is Mon-Fri 9am-4pm in the provider's timezone
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
  try {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = Date.now();
    const fortyFiveDaysAgo = new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString();

    const counts = {
      profilePreviewNudge: 0,
      skipped: 0,
      errors: 0,
    };

    const { data: providers, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, created_at, account_id, state")
      .in("type", ["organization", "caregiver"])
      .not("account_id", "is", null)
      .gte("created_at", fortyFiveDaysAgo)
      .limit(200);

    if (fetchError) {
      console.error("[cron/profile-preview-nudge] Fetch error:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!providers?.length) {
      return NextResponse.json({
        status: "ok",
        message: "No providers needing profile preview nudge",
        dry_run: dryRun,
        ...counts,
      });
    }

    // Resolve emails from accounts where business_profiles.email is null
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

      if (meta.admin_archived === true) {
        counts.skipped++;
        continue;
      }

      // Must have passed through the verification step
      if (!meta.welcome_email_sent || !meta.verification_nudge_sent) {
        counts.skipped++;
        continue;
      }

      // Already sent
      if (meta.profile_preview_nudge_sent) {
        counts.skipped++;
        continue;
      }

      // Must be at least 48h since the verification step was processed
      const verifSentAt = meta.verification_nudge_sent_at as string | undefined;
      const verifTs = verifSentAt ? new Date(verifSentAt).getTime() : 0;
      const hoursSinceVerif = verifTs ? (now - verifTs) / (60 * 60 * 1000) : Infinity;

      if (hoursSinceVerif < 48) {
        counts.skipped++;
        continue;
      }

      // Business hours only
      if (!isBusinessHours(new Date(now), provider.state)) {
        counts.skipped++;
        continue;
      }

      // Resolve email
      let email = provider.email;
      const verificationSubmission = meta.verification_submission as Record<string, unknown> | undefined;
      let recipientName = verificationSubmission?.name as string || provider.display_name || "there";

      if (!email && provider.account_id && accountEmailMap[provider.account_id]) {
        email = accountEmailMap[provider.account_id].email;
        if (recipientName === "there") {
          recipientName = accountEmailMap[provider.account_id].name;
        }
      }

      if (!email) {
        counts.skipped++;
        continue;
      }

      const providerName = provider.display_name || "your Olera page";

      try {
        if (!dryRun) {
          const subject = `How does ${providerName} look to families?`;

          const emailLogId = await reserveEmailLogId({
            to: email,
            subject,
            emailType: "profile_preview_nudge",
            recipientType: "provider",
            providerId: provider.id,
          });

          // HMAC token link (15-day expiry) for one-click sign-in → public profile page
          const profileUrl = generateProviderPortalUrl(provider.slug, email, "profile", siteUrl);

          await sendEmail({
            to: email,
            subject,
            html: onboardingProfilePreviewEmail({
              providerName,
              profileUrl,
              providerSlug: provider.slug,
            }),
            emailType: "profile_preview_nudge",
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
                profile_preview_nudge_sent: true,
                profile_preview_nudge_sent_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", provider.id);
        }

        console.log(`[cron/profile-preview-nudge] Profile preview nudge: ${providerName} (${email})`);
        counts.profilePreviewNudge++;
      } catch (err) {
        console.error(`[cron/profile-preview-nudge] Error for ${provider.id}:`, err);
        counts.errors++;
      }
    }

    return NextResponse.json({
      status: "ok",
      dry_run: dryRun,
      processed: providers.length,
      ...counts,
    });
  } catch (err) {
    console.error("[cron/profile-preview-nudge] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
