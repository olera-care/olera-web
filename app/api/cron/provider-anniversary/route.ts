import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { anniversaryMilestoneEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";

/**
 * GET /api/cron/provider-anniversary
 *
 * Runs daily. Sends anniversary and milestone emails to providers:
 *
 * 1. Anniversary: Providers whose join month/day matches today (1 year anniversary)
 * 2. Connection milestones: Providers who just hit 10, 50, or 100 connections
 *
 * Each email sent at most once per milestone (metadata flag guard).
 */
export const maxDuration = 60;

// Connection milestones to celebrate
const MILESTONES = [10, 50, 100];

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

  return withCronRun("provider-anniversary", async () => {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = new Date();
    const todayMonth = now.getMonth() + 1; // 1-12
    const todayDay = now.getDate();
    const currentYear = now.getFullYear();

    const counts = {
      anniversaries: 0,
      milestones: 0,
      skipped: 0,
      errors: 0,
    };

    // Find all verified providers with an account
    const { data: providers, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, account_id, created_at")
      .in("type", ["organization", "caregiver"])
      .eq("verification_state", "verified")
      .not("account_id", "is", null)
      .limit(500);

    if (fetchError) {
      console.error("[cron/provider-anniversary] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!providers?.length) {
      return {
        status: "ok",
        message: "No providers to check",
        dry_run: dryRun,
        ...counts,
      };
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

    // Get connection counts for all providers
    const providerIds = providers.map((p) => p.id);
    const { data: connectionCounts } = await db
      .from("connections")
      .select("to_profile_id")
      .in("to_profile_id", providerIds)
      .eq("type", "inquiry");

    // Build connection count map
    const connectionCountMap: Record<string, number> = {};
    for (const conn of connectionCounts || []) {
      connectionCountMap[conn.to_profile_id] = (connectionCountMap[conn.to_profile_id] || 0) + 1;
    }

    // Process each provider
    for (const provider of providers) {
      const meta = (provider.metadata || {}) as Record<string, unknown>;

      // Get email
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

      if (!email) {
        counts.skipped++;
        continue;
      }

      const providerName = provider.display_name || "your organization";
      const createdAt = new Date(provider.created_at);
      const createdMonth = createdAt.getMonth() + 1;
      const createdDay = createdAt.getDate();
      const createdYear = createdAt.getFullYear();

      // Check for anniversary (1+ years on platform, same month/day as today)
      const yearsOnPlatform = currentYear - createdYear;
      const isAnniversary = yearsOnPlatform >= 1 && createdMonth === todayMonth && createdDay === todayDay;
      const anniversarySentThisYear = meta[`anniversary_${currentYear}_sent`] as boolean | undefined;

      if (isAnniversary && !anniversarySentThisYear) {
        try {
          if (!dryRun) {
            const emailLogId = await reserveEmailLogId({
              to: email,
              subject: `Happy ${yearsOnPlatform} ${yearsOnPlatform === 1 ? "year" : "years"} on Olera!`,
              emailType: "provider_anniversary",
              recipientType: "provider",
              providerId: provider.id,
            });

            // Generate magic link for auto-sign-in
            const dashboardPath = appendTrackingParams("/provider", emailLogId);
            let dashboardUrl = `${siteUrl}${dashboardPath}`;

            try {
              const { data: magicLinkData, error: magicLinkError } = await db.auth.admin.generateLink({
                type: "magiclink",
                email,
                options: {
                  redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(dashboardPath)}`,
                },
              });
              if (!magicLinkError && magicLinkData?.properties?.action_link) {
                dashboardUrl = magicLinkData.properties.action_link;
              }
            } catch (linkErr) {
              console.error("[cron/provider-anniversary] Failed to generate magic link:", linkErr);
              // Continue with fallback URL
            }

            await sendEmail({
              to: email,
              subject: `Happy ${yearsOnPlatform} ${yearsOnPlatform === 1 ? "year" : "years"} on Olera!`,
              html: anniversaryMilestoneEmail({
                providerName,
                recipientName,
                slug: provider.slug,
                milestoneType: "anniversary",
                yearsOnPlatform,
                dashboardUrl,
              }),
              emailType: "provider_anniversary",
              recipientType: "provider",
              providerId: provider.id,
              emailLogId: emailLogId ?? undefined,
              recipientProfileId: provider.id,
            });

            // Mark as sent for this year
            await db
              .from("business_profiles")
              .update({
                metadata: {
                  ...meta,
                  [`anniversary_${currentYear}_sent`]: true,
                  [`anniversary_${currentYear}_sent_at`]: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
              })
              .eq("id", provider.id);
          }

          console.log(`[cron/provider-anniversary] ${dryRun ? "[DRY RUN] " : ""}Anniversary (${yearsOnPlatform}y): ${providerName} (${email})`);
          counts.anniversaries++;
        } catch (err) {
          console.error(`[cron/provider-anniversary] Anniversary error for ${provider.id}:`, err);
          counts.errors++;
        }
        // Continue to check milestones even after anniversary
      }

      // Check for connection milestones
      const totalConnections = connectionCountMap[provider.id] || 0;

      for (const milestone of MILESTONES) {
        const milestoneKey = `milestone_${milestone}_sent`;
        const alreadySent = meta[milestoneKey] as boolean | undefined;

        // Check if they've reached this milestone but haven't been notified
        if (totalConnections >= milestone && !alreadySent) {
          // Check if they already passed a higher milestone (only send for the highest reached)
          const higherMilestones = MILESTONES.filter((m) => m > milestone);
          const reachedHigher = higherMilestones.some((m) => totalConnections >= m);
          if (reachedHigher) {
            // Skip lower milestones if they've reached a higher one
            continue;
          }

          try {
            if (!dryRun) {
              const emailLogId = await reserveEmailLogId({
                to: email,
                subject: `Milestone: ${milestone}th connection!`,
                emailType: "provider_milestone",
                recipientType: "provider",
                providerId: provider.id,
              });

              // Generate magic link for auto-sign-in
              const dashboardPath = appendTrackingParams("/provider", emailLogId);
              let dashboardUrl = `${siteUrl}${dashboardPath}`;

              try {
                const { data: magicLinkData, error: magicLinkError } = await db.auth.admin.generateLink({
                  type: "magiclink",
                  email,
                  options: {
                    redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(dashboardPath)}`,
                  },
                });
                if (!magicLinkError && magicLinkData?.properties?.action_link) {
                  dashboardUrl = magicLinkData.properties.action_link;
                }
              } catch (linkErr) {
                console.error("[cron/provider-anniversary] Failed to generate magic link for milestone:", linkErr);
                // Continue with fallback URL
              }

              await sendEmail({
                to: email,
                subject: `Milestone: ${milestone}th connection!`,
                html: anniversaryMilestoneEmail({
                  providerName,
                  recipientName,
                  slug: provider.slug,
                  milestoneType: "connections",
                  totalConnections,
                  connectionMilestone: milestone,
                  dashboardUrl,
                }),
                emailType: "provider_milestone",
                recipientType: "provider",
                providerId: provider.id,
                emailLogId: emailLogId ?? undefined,
                recipientProfileId: provider.id,
              });

              // Mark milestone as sent
              // Also mark all lower milestones as sent (they've passed those)
              const metaUpdates: Record<string, unknown> = {
                ...meta,
                [milestoneKey]: true,
                [`${milestoneKey}_at`]: new Date().toISOString(),
              };

              // Mark lower milestones as sent too
              for (const lowerMilestone of MILESTONES.filter((m) => m < milestone)) {
                metaUpdates[`milestone_${lowerMilestone}_sent`] = true;
              }

              await db
                .from("business_profiles")
                .update({
                  metadata: metaUpdates,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", provider.id);
            }

            console.log(`[cron/provider-anniversary] ${dryRun ? "[DRY RUN] " : ""}Milestone (${milestone}): ${providerName} (${email}), total: ${totalConnections}`);
            counts.milestones++;
          } catch (err) {
            console.error(`[cron/provider-anniversary] Milestone error for ${provider.id}:`, err);
            counts.errors++;
          }
          break; // Only send one milestone email at a time
        }
      }
    }

    return {
      status: "ok",
      dry_run: dryRun,
      processed: providers.length,
      ...counts,
    };
  });
}
