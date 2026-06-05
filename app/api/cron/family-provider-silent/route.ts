import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { providerSilentEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";

/**
 * GET /api/cron/family-provider-silent
 *
 * Runs daily. Sends Email #4 to families when provider has been silent for ~4 days.
 * Recommends alternative responsive providers in the same area.
 *
 * Trigger conditions:
 * - Connection is 4-5 days old (96-120 hours)
 * - Provider has NOT responded (no messages from provider in thread)
 * - Family has NOT connected with other providers yet
 * - Email not already sent (family_alternatives_sent_at not set)
 * - Send ONCE per connection
 * - Stop if family connects with anyone else
 *
 * Responsive providers filter:
 * - Active providers in same city/state
 * - Same care type as original provider
 * - Have actually responded to leads before (message activity exists)
 */

export const maxDuration = 120;

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

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

  return withCronRun("family-provider-silent", async () => {
    const db = getServiceClient();
    const siteUrl = getSiteUrl();
    const now = Date.now();
    const fourDaysAgo = new Date(now - FOUR_DAYS_MS).toISOString();
    const fiveDaysAgo = new Date(now - FIVE_DAYS_MS).toISOString();

    const counts = {
      processed: 0,
      sent: 0,
      skipped: 0,
      skipReasons: {
        provider_responded: 0,
        family_connected_elsewhere: 0,
        already_sent: 0,
        no_email: 0,
        no_responsive_providers: 0,
        send_failed: 0,
      },
      dry_run: dryRun,
    };

    // Fetch connections that are 4-5 days old (inquiry type only)
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
          city,
          state,
          care_types,
          metadata
        ),
        to_profile:business_profiles!connections_to_profile_id_fkey(
          display_name,
          city,
          state,
          care_types,
          metadata
        )
      `
      )
      .eq("type", "inquiry")
      .gte("created_at", fiveDaysAgo)
      .lte("created_at", fourDaysAgo)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("[cron/family-provider-silent] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!connections?.length) {
      return {
        ok: true,
        message: "No connections to process",
        ...counts,
      };
    }

    for (const conn of connections) {
      counts.processed++;

      // Normalize joined relations
      const fromProfile = Array.isArray(conn.from_profile)
        ? conn.from_profile[0]
        : conn.from_profile;
      const toProfile = Array.isArray(conn.to_profile)
        ? conn.to_profile[0]
        : conn.to_profile;

      const meta = (conn.metadata || {}) as Record<string, unknown>;

      // Skip if already sent this email
      if (meta.family_alternatives_sent_at) {
        counts.skipped++;
        counts.skipReasons.already_sent++;
        continue;
      }

      // Check if provider has responded (any message from provider in thread)
      const thread = (meta.thread as ThreadMessage[]) || [];
      const providerResponded = thread.some(
        (m) =>
          m.from_profile_id === conn.to_profile_id &&
          !m.is_auto_reply &&
          m.text?.trim()
      );

      if (providerResponded) {
        counts.skipped++;
        counts.skipReasons.provider_responded++;
        continue;
      }

      // Check if family has connected with other providers
      // Stop the moment family connects with anyone else
      const { data: familyConnections, error: familyConnError } = await db
        .from("connections")
        .select("id")
        .eq("from_profile_id", conn.from_profile_id)
        .eq("type", "inquiry")
        .neq("id", conn.id)
        .limit(1);

      if (familyConnError) {
        console.error(
          "[cron/family-provider-silent] Error checking family connections:",
          familyConnError
        );
        counts.skipped++;
        continue;
      }

      if (familyConnections && familyConnections.length > 0) {
        counts.skipped++;
        counts.skipReasons.family_connected_elsewhere++;
        continue;
      }

      // Get family email (need to resolve auth email for magic link)
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

      // Determine if provider actively passed (has archive_reason)
      const providerPassed = !!meta.archive_reason;

      // Get provider info
      const providerName = toProfile?.display_name || "the provider";
      const providerCity = toProfile?.city as string | undefined;
      const providerState = toProfile?.state as string | undefined;
      const providerCareTypes = (toProfile?.care_types as string[]) || [];

      // Find responsive providers in same area with same care type
      // "Responsive" = active providers who have sent messages before
      // First, get candidate providers (same city, state, care type, active)
      let responsiveProvidersQuery = db
        .from("business_profiles")
        .select("id, display_name, slug, city, state, care_types, metadata")
        .eq("type", "organization")
        .eq("is_active", true)
        .neq("id", conn.to_profile_id);

      // Filter by city if available
      if (providerCity) responsiveProvidersQuery = responsiveProvidersQuery.eq("city", providerCity);
      if (providerState) responsiveProvidersQuery = responsiveProvidersQuery.eq("state", providerState);

      const { data: candidateProviders } = await responsiveProvidersQuery.limit(50);

      // Filter to providers with matching care types and who have responded to leads
      const responsiveProviderIds: string[] = [];
      if (candidateProviders) {
        for (const provider of candidateProviders) {
          const provCareTypes = (provider.care_types as string[]) || [];
          // Check if any care type matches
          const hasMatchingCareType =
            providerCareTypes.length === 0 ||
            provCareTypes.some((ct) => providerCareTypes.includes(ct));

          if (!hasMatchingCareType) continue;

          // Check if provider has sent messages (responsive indicator)
          // Look for connections where this provider is to_profile and has messages in thread
          const { data: providerConns } = await db
            .from("connections")
            .select("metadata")
            .eq("to_profile_id", provider.id)
            .limit(5);

          if (providerConns) {
            const hasResponded = providerConns.some((c) => {
              const cMeta = (c.metadata || {}) as Record<string, unknown>;
              const cThread = (cMeta.thread as ThreadMessage[]) || [];
              return cThread.some(
                (m) =>
                  m.from_profile_id === provider.id &&
                  !m.is_auto_reply &&
                  m.text?.trim()
              );
            });

            if (hasResponded) {
              responsiveProviderIds.push(provider.id);
            }
          }
        }
      }

      // Get final list of responsive providers (limit to 3)
      const recommendedProviders: {
        name: string;
        slug: string;
        priceRange: string | null;
      }[] = [];

      if (responsiveProviderIds.length > 0) {
        const { data: finalProviders } = await db
          .from("business_profiles")
          .select("display_name, slug, metadata")
          .in("id", responsiveProviderIds)
          .limit(3);

        if (finalProviders) {
          recommendedProviders.push(
            ...finalProviders.map((p) => ({
              name: p.display_name,
              slug: p.slug,
              priceRange: (p.metadata as Record<string, unknown> | null)?.price_range as string | null || null,
            }))
          );
        }
      }

      // Skip if no responsive providers found
      if (recommendedProviders.length === 0) {
        counts.skipped++;
        counts.skipReasons.no_responsive_providers++;
        continue;
      }

      if (dryRun) {
        console.log(
          `[cron/family-provider-silent] [DRY RUN] Would send to ${familyEmail} for connection ${conn.id} with ${recommendedProviders.length} providers`
        );
        counts.sent++;
        continue;
      }

      // Build browse URL (filter by city and care type)
      const familyCareTypes = (fromProfile?.care_types as string[]) || providerCareTypes;
      const careTypeSlug = familyCareTypes[0]?.toLowerCase().replace(/\s+/g, "-") || "senior-care";
      const citySlug = providerCity?.toLowerCase().replace(/\s+/g, "-") || "";
      const stateSlug = providerState?.toLowerCase() || "";

      // Build browse URL with filters
      let browseUrl = `${siteUrl}/browse`;
      if (citySlug && stateSlug) {
        browseUrl = `${siteUrl}/${careTypeSlug}/${stateSlug}/${citySlug}`;
      } else if (stateSlug) {
        browseUrl = `${siteUrl}/${careTypeSlug}/${stateSlug}`;
      }

      // Subject line changes based on variant
      const subject = providerPassed
        ? "A few other providers near you"
        : `A few other providers near you, while you wait`;

      // Reserve email log ID
      const emailLogId = await reserveEmailLogId({
        to: familyEmail,
        subject,
        emailType: "family_provider_silent",
        recipientType: "family",
        metadata: {
          connection_id: conn.id,
          provider_id: conn.to_profile_id,
          provider_passed: providerPassed,
          recommended_count: recommendedProviders.length,
        },
      });

      const browseUrlTracked = appendTrackingParams(browseUrl, emailLogId);

      // Generate email HTML
      const emailHtml = providerSilentEmail({
        familyName: fromProfile?.display_name || "",
        providerName,
        providerPassed,
        recommendedProviders,
        browseUrl: browseUrlTracked,
        city: providerCity || null,
      });

      // Send email
      const { success, error: sendError } = await sendEmail({
        to: familyEmail,
        subject,
        html: emailHtml,
        emailType: "family_provider_silent",
        recipientType: "family",
        metadata: {
          connection_id: conn.id,
          provider_id: conn.to_profile_id,
          provider_passed: providerPassed,
          recommended_count: recommendedProviders.length,
        },
        emailLogId: emailLogId ?? undefined,
      });

      if (!success) {
        console.error(
          `[cron/family-provider-silent] Send failed for ${conn.id}:`,
          sendError
        );
        counts.skipped++;
        counts.skipReasons.send_failed++;
        continue;
      }

      // Mark as sent so we don't send again
      await db
        .from("connections")
        .update({
          metadata: {
            ...meta,
            family_alternatives_sent_at: new Date().toISOString(),
            family_alternatives_sent_by: "cron:family-provider-silent",
            family_alternatives_count: recommendedProviders.length,
          },
        })
        .eq("id", conn.id);

      counts.sent++;
    }

    return {
      ok: true,
      ...counts,
    };
  });
}
