import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  verificationReminder21DayEmail,
} from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { generateProviderPortalUrl } from "@/lib/claim-tokens";

/**
 * GET /api/cron/verification-reminders
 *
 * Runs daily. Sends a 21-day verification reminder to providers who claimed
 * but haven't completed verification. The onboarding sequence handles the
 * early nudge at +24h; this is the safety-net follow-up.
 *
 * Each email sent at most ONCE per provider (metadata flag guard).
 * Defers if the provider already received a weekly digest today.
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

  return withCronRun("verification-reminders", async () => {
  try {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = Date.now();
    const twentyOneDaysAgo = new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString();

    const counts = {
      reminder21Day: 0,
      skipped: 0,
      deferredDigestCollision: 0,
      errors: 0,
    };

    // Fetch providers needing verification
    // verification_state = 'unverified' means they claimed but haven't submitted verification
    const { data: providers, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, created_at, account_id")
      .in("type", ["organization", "caregiver"])
      .eq("verification_state", "unverified")
      .not("account_id", "is", null) // Only claimed providers
      .lte("created_at", twentyOneDaysAgo) // At least 21 days old
      .limit(200);

    if (fetchError) {
      console.error("[cron/verification-reminders] Fetch error:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!providers?.length) {
      return NextResponse.json({
        status: "ok",
        message: "No providers needing reminders",
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
        const userIds = accounts.map((a) => a.user_id).filter(Boolean);
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

    // Check which providers already received a digest today so we don't
    // stack two emails on the same day. Defer to next run instead.
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const providerIds = providers.map((p) => p.id);
    const digestSentToday = new Set<string>();

    if (providerIds.length > 0) {
      const { data: digestRows } = await db
        .from("email_log")
        .select("provider_id")
        .eq("email_type", "weekly_analytics_digest")
        .in("provider_id", providerIds)
        .gte("created_at", todayStart.toISOString());

      for (const row of digestRows || []) {
        if (row.provider_id) digestSentToday.add(row.provider_id);
      }
    }

    // Process each provider
    for (const provider of providers) {
      const meta = (provider.metadata || {}) as Record<string, unknown>;
      const verificationSubmission = meta.verification_submission as Record<string, unknown> | undefined;

      // Get email and recipient name
      let email = provider.email;
      let recipientName = verificationSubmission?.name as string || "there";

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

      // Skip if this provider already got a digest today — defer to next run
      if (digestSentToday.has(provider.id)) {
        counts.deferredDigestCollision++;
        continue;
      }

      const providerName = provider.display_name || "your organization";
      const verifyUrl = generateProviderPortalUrl(provider.slug, email, "verify", siteUrl);
      const claimDate = new Date(provider.created_at).getTime();
      const daysSinceClaim = Math.floor((now - claimDate) / (24 * 60 * 60 * 1000));

      try {
        // 21-day verification reminder (if not sent)
        if (daysSinceClaim >= 21 && !meta.verification_reminder_21d_sent) {
          if (!dryRun) {
            await sendEmail({
              to: email,
              subject: `Verify ${providerName} to unlock your full dashboard`,
              html: verificationReminder21DayEmail({
                providerName,
                recipientName,
                verifyUrl,
              }),
              emailType: "verification_reminder_21d",
              recipientType: "provider",
              providerId: provider.slug,
            });

            await db
              .from("business_profiles")
              .update({
                metadata: {
                  ...meta,
                  verification_reminder_21d_sent: true,
                  verification_reminder_21d_sent_at: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
              })
              .eq("id", provider.id);
          }

          console.log(`[cron/verification-reminders] 21-day reminder: ${providerName} (${email})`);
          counts.reminder21Day++;
          continue;
        }

      } catch (err) {
        console.error(`[cron/verification-reminders] Error for ${provider.id}:`, err);
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
    console.error("[cron/verification-reminders] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
