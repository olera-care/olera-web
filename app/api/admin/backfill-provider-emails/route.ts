import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";

/**
 * POST /api/admin/backfill-provider-emails
 *
 * One-time backfill endpoint to:
 * 1. Find providers with email in olera-providers but not in business_profiles
 * 2. Sync the email to business_profiles
 * 3. Send deferred notifications for pending leads and questions
 *
 * Query params:
 * - dry_run=true: Preview what would be done without making changes
 * - limit=N: Process only first N providers (default: all)
 *
 * This endpoint is idempotent - running it multiple times is safe.
 * The send-deferred-notifications function checks email_sent_at to avoid double-sending.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dry_run") === "true";
    const limit = parseInt(searchParams.get("limit") || "1000", 10);

    const db = getServiceClient();

    // Step 1: Find business_profiles with no email but linked to olera-providers that have email
    const { data: profilesWithoutEmail, error: fetchError } = await db
      .from("business_profiles")
      .select("id, display_name, slug, source_provider_id, email, is_active, metadata")
      .is("email", null)
      .not("source_provider_id", "is", null)
      .eq("is_active", true)
      .limit(limit);

    if (fetchError) {
      console.error("[backfill] Failed to fetch profiles:", fetchError);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    if (!profilesWithoutEmail?.length) {
      return NextResponse.json({
        success: true,
        message: "No profiles need backfill",
        stats: { processed: 0, synced: 0, notified: 0 },
      });
    }

    // Get source_provider_ids
    const sourceProviderIds = profilesWithoutEmail
      .map((p) => p.source_provider_id)
      .filter(Boolean) as string[];

    // Look up emails in olera-providers
    const { data: oleraProviders } = await db
      .from("olera-providers")
      .select("provider_id, email, provider_name")
      .in("provider_id", sourceProviderIds)
      .not("deleted", "is", true);

    // Build map of provider_id -> email
    const oleraEmailMap = new Map<string, { email: string; name: string }>();
    for (const p of oleraProviders ?? []) {
      if (p.email?.trim()) {
        oleraEmailMap.set(p.provider_id, { email: p.email.trim(), name: p.provider_name || "" });
      }
    }

    // Find profiles that need backfill (have email in olera-providers)
    const profilesToBackfill = profilesWithoutEmail.filter(
      (p) => p.source_provider_id && oleraEmailMap.has(p.source_provider_id)
    );

    const stats = {
      total_profiles_without_email: profilesWithoutEmail.length,
      profiles_with_olera_email: profilesToBackfill.length,
      processed: 0,
      synced: 0,
      lead_notifications_sent: 0,
      question_notifications_sent: 0,
      errors: 0,
      dry_run: dryRun,
    };

    const results: Array<{
      profileId: string;
      providerName: string;
      email: string;
      leadsSent: number;
      questionsSent: number;
      error?: string;
    }> = [];

    for (const profile of profilesToBackfill) {
      const oleraData = oleraEmailMap.get(profile.source_provider_id!);
      if (!oleraData) continue;

      stats.processed++;
      const { email, name } = oleraData;

      if (dryRun) {
        results.push({
          profileId: profile.id,
          providerName: profile.display_name || name,
          email,
          leadsSent: 0,
          questionsSent: 0,
        });
        continue;
      }

      try {
        // Step 2: Sync email to business_profiles
        const { error: syncError } = await db
          .from("business_profiles")
          .update({ email })
          .eq("id", profile.id);

        if (syncError) {
          console.error(`[backfill] Sync failed for ${profile.id}:`, syncError);
          stats.errors++;
          results.push({
            profileId: profile.id,
            providerName: profile.display_name || name,
            email,
            leadsSent: 0,
            questionsSent: 0,
            error: `Sync failed: ${syncError.message}`,
          });
          continue;
        }

        stats.synced++;

        // Step 3: Send deferred notifications
        const profileMeta = (profile.metadata as Record<string, unknown>) || {};
        const providerSlug = profile.slug || profile.source_provider_id || "";

        // Build additional slug variants for question lookup
        const additionalSlugVariants: string[] = [];
        if (profile.source_provider_id && profile.source_provider_id !== providerSlug) {
          additionalSlugVariants.push(profile.source_provider_id);
        }

        const notifyResult = await sendDeferredNotificationsForProvider({
          profileId: profile.id,
          email,
          providerName: profile.display_name || name || "Provider",
          providerSlug,
          additionalSlugVariants,
          leadsUnsubscribed: !!profileMeta.leads_unsubscribed,
        });

        stats.lead_notifications_sent += notifyResult.leadEmailsSent;
        stats.question_notifications_sent += notifyResult.questionEmailsSent;

        results.push({
          profileId: profile.id,
          providerName: profile.display_name || name,
          email,
          leadsSent: notifyResult.leadEmailsSent,
          questionsSent: notifyResult.questionEmailsSent,
        });
      } catch (err) {
        console.error(`[backfill] Error processing ${profile.id}:`, err);
        stats.errors++;
        results.push({
          profileId: profile.id,
          providerName: profile.display_name || name,
          email,
          leadsSent: 0,
          questionsSent: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Audit log
    if (!dryRun && stats.synced > 0) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "backfill_provider_emails",
        targetType: "system",
        targetId: "backfill",
        details: {
          profiles_synced: stats.synced,
          lead_notifications_sent: stats.lead_notifications_sent,
          question_notifications_sent: stats.question_notifications_sent,
          errors: stats.errors,
        },
      });
    }

    return NextResponse.json({
      success: true,
      stats,
      results: dryRun ? results : results.slice(0, 20), // Limit results in response for non-dry-run
    });
  } catch (err) {
    console.error("[backfill] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
