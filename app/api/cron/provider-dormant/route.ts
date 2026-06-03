import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { dormantReengagementEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";

/**
 * GET /api/cron/provider-dormant
 *
 * Runs daily. Sends re-engagement emails to providers who have been inactive
 * for 30+ days. "Activity" = last message sent OR last lead received.
 *
 * Detection logic:
 * - verification_state = 'verified'
 * - No activity (message sent or lead received) in 30+ days
 * - Not received this email in the last 60 days (metadata.dormant_email_sent_at)
 *
 * Each email sent at most once per 60 days per provider.
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

  return withCronRun("provider-dormant", async () => {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

    const counts = {
      sent: 0,
      skipped: 0,
      errors: 0,
    };

    // Find verified providers
    const { data: providers, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, account_id, city, state")
      .in("type", ["organization", "caregiver"])
      .eq("verification_state", "verified")
      .not("account_id", "is", null)
      .limit(200);

    if (fetchError) {
      console.error("[cron/provider-dormant] Fetch error:", fetchError);
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

    // Get last activity for each provider (from provider_activity)
    const providerIds = providers.map((p) => p.slug || p.id);
    const { data: activities } = await db
      .from("provider_activity")
      .select("provider_id, event_type, created_at")
      .in("provider_id", providerIds)
      .in("event_type", ["message_sent", "lead_received"])
      .order("created_at", { ascending: false });

    // Build last activity map
    const lastActivityMap: Record<string, string> = {};
    for (const activity of activities || []) {
      if (!lastActivityMap[activity.provider_id]) {
        lastActivityMap[activity.provider_id] = activity.created_at;
      }
    }

    // Get new families count for each provider's city (for personalization)
    const cities = Array.from(new Set(providers.map((p) => p.city).filter(Boolean))) as string[];
    let familiesCountMap: Record<string, number> = {};
    if (cities.length > 0) {
      const thirtyDaysAgoDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: familyCounts } = await db
        .from("business_profiles")
        .select("city")
        .eq("type", "family")
        .not("city", "is", null)
        .in("city", cities)
        .gte("created_at", thirtyDaysAgoDate);

      if (familyCounts) {
        for (const fc of familyCounts) {
          if (fc.city) {
            familiesCountMap[fc.city] = (familiesCountMap[fc.city] || 0) + 1;
          }
        }
      }
    }

    // Process each provider
    for (const provider of providers) {
      const meta = (provider.metadata || {}) as Record<string, unknown>;
      const providerId = provider.slug || provider.id;

      // Skip if recently sent dormant email (within 60 days)
      const lastDormantEmail = meta.dormant_email_sent_at as string | undefined;
      if (lastDormantEmail && new Date(lastDormantEmail) > new Date(sixtyDaysAgo)) {
        counts.skipped++;
        continue;
      }

      // Check last activity
      const lastActivity = lastActivityMap[providerId];
      if (lastActivity && new Date(lastActivity) > new Date(thirtyDaysAgo)) {
        // Provider has been active in the last 30 days
        counts.skipped++;
        continue;
      }

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

      // Calculate days since last activity
      let daysSinceActivity = 30;
      if (lastActivity) {
        daysSinceActivity = Math.floor((now - new Date(lastActivity).getTime()) / (24 * 60 * 60 * 1000));
      }

      // Get new families count for this provider's city
      const newFamiliesCount = provider.city ? (familiesCountMap[provider.city] || 0) : undefined;

      try {
        if (!dryRun) {
          const emailLogId = await reserveEmailLogId({
            to: email,
            subject: "Families are still looking for you",
            emailType: "dormant_reengagement",
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
            console.error("[cron/provider-dormant] Failed to generate magic link:", linkErr);
            // Continue with fallback URL
          }

          await sendEmail({
            to: email,
            subject: "Families are still looking for you",
            html: dormantReengagementEmail({
              providerName,
              recipientName,
              slug: provider.slug,
              daysSinceActivity,
              newFamiliesCount,
              city: provider.city || undefined,
              dashboardUrl,
              providerSlug: provider.slug,
            }),
            emailType: "dormant_reengagement",
            recipientType: "provider",
            providerId: provider.id,
            emailLogId: emailLogId ?? undefined,
            recipientProfileId: provider.id,
          });

          // Mark as sent
          await db
            .from("business_profiles")
            .update({
              metadata: {
                ...meta,
                dormant_email_sent_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", provider.id);
        }

        console.log(`[cron/provider-dormant] ${dryRun ? "[DRY RUN] " : ""}Sent to: ${providerName} (${email}), ${daysSinceActivity} days inactive`);
        counts.sent++;
      } catch (err) {
        console.error(`[cron/provider-dormant] Error for ${provider.id}:`, err);
        counts.errors++;
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
