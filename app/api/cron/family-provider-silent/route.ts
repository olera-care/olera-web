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

      // Check if family has connected with other providers (ANY type)
      // Stop the moment family connects with anyone else
      const { data: familyConnections, error: familyConnError } = await db
        .from("connections")
        .select("id")
        .eq("from_profile_id", conn.from_profile_id)
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

      // Determine if provider actively passed (specific archive reasons only)
      // Only "not_accepting" and "not_a_fit" indicate active pass
      // Other reasons (unable_to_reach, already_connected, other) don't count
      const providerPassed = ["not_accepting", "not_a_fit"].includes(
        meta.archive_reason as string
      );

      // Get provider info
      const providerName = toProfile?.display_name || "the provider";
      const providerCity = toProfile?.city as string | undefined;
      const providerState = toProfile?.state as string | undefined;
      const providerCareTypes = (toProfile?.care_types as string[]) || [];

      // Find responsive providers in same area with same care type
      // "Responsive" = active providers who have sent messages in last 60 days

      // Skip if no city/state (can't recommend "near you" without location)
      if (!providerCity || !providerState) {
        counts.skipped++;
        counts.skipReasons.no_responsive_providers++;
        continue;
      }

      // Skip if original provider has no care types (can't match)
      if (!providerCareTypes || providerCareTypes.length === 0) {
        counts.skipped++;
        counts.skipReasons.no_responsive_providers++;
        continue;
      }

      // Get candidate providers (same city, state, active)
      const { data: candidateProviders } = await db
        .from("business_profiles")
        .select("id, display_name, slug, city, state, care_types, metadata")
        .eq("type", "organization")
        .eq("is_active", true)
        .eq("city", providerCity)
        .eq("state", providerState)
        .neq("id", conn.to_profile_id)
        .limit(50);

      if (!candidateProviders || candidateProviders.length === 0) {
        counts.skipped++;
        counts.skipReasons.no_responsive_providers++;
        continue;
      }

      // Filter to providers with matching care types (in memory)
      const matchingProviders = candidateProviders.filter((provider) => {
        const provCareTypes = (provider.care_types as string[]) || [];
        // Must have at least one matching care type
        return provCareTypes.some((ct) => providerCareTypes.includes(ct));
      });

      if (matchingProviders.length === 0) {
        counts.skipped++;
        counts.skipReasons.no_responsive_providers++;
        continue;
      }

      // Fetch ALL connections for ALL matching providers in ONE query (performance optimization)
      const providerIds = matchingProviders.map((p) => p.id);
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

      const { data: allConnections } = await db
        .from("connections")
        .select("to_profile_id, metadata, created_at")
        .in("to_profile_id", providerIds)
        .gte("created_at", sixtyDaysAgo);

      // Build map of provider_id -> has_responded (in memory filtering)
      const responsiveProviderIds = new Set<string>();

      if (allConnections) {
        for (const conn of allConnections) {
          if (responsiveProviderIds.has(conn.to_profile_id)) continue; // Already marked responsive

          const cMeta = (conn.metadata || {}) as Record<string, unknown>;
          const cThread = (cMeta.thread as ThreadMessage[]) || [];
          const hasResponded = cThread.some(
            (m) =>
              m.from_profile_id === conn.to_profile_id &&
              !m.is_auto_reply &&
              m.text?.trim()
          );

          if (hasResponded) {
            responsiveProviderIds.add(conn.to_profile_id);
          }
        }
      }

      // Filter to responsive providers and limit to 3
      const recommendedProviders: {
        name: string;
        slug: string;
        priceRange: string | null;
        viewUrl: string; // Will be filled with magic link
      }[] = matchingProviders
        .filter((p) => responsiveProviderIds.has(p.id))
        .slice(0, 3)
        .map((p) => ({
          name: p.display_name,
          slug: p.slug,
          priceRange: (p.metadata as Record<string, unknown> | null)?.price_range as string | null || null,
          viewUrl: "", // Placeholder, will be filled with magic link
        }));

      // Skip if no responsive providers found
      if (recommendedProviders.length === 0) {
        counts.skipped++;
        counts.skipReasons.no_responsive_providers++;
        continue;
      }

      // Mark as will-send before sending (transaction safety - prevents duplicate sends)
      const sentAt = new Date().toISOString();
      await db
        .from("connections")
        .update({
          metadata: {
            ...meta,
            family_alternatives_sent_at: sentAt,
            family_alternatives_sent_by: "cron:family-provider-silent",
            family_alternatives_count: recommendedProviders.length,
          },
        })
        .eq("id", conn.id);

      if (dryRun) {
        console.log(
          `[cron/family-provider-silent] [DRY RUN] Would send to ${familyEmail} for connection ${conn.id} with ${recommendedProviders.length} providers`
        );
        counts.sent++;
        continue;
      }

      // Build browse URL with query params (guaranteed to work, no slug issues)
      const familyCareTypes = (fromProfile?.care_types as string[]) || providerCareTypes;
      const primaryCareType = familyCareTypes[0] || "senior-care";

      const browseParams = new URLSearchParams({
        care_type: primaryCareType,
        city: providerCity,
        state: providerState,
      });
      const browseDestination = `/browse?${browseParams.toString()}`;

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

      const browseUrlTracked = appendTrackingParams(browseDestination, emailLogId);

      // Generate magic link for browse URL (use auth email)
      let browseMagicLink = `${siteUrl}${browseUrlTracked}`; // Fallback
      try {
        const { data: magicLinkData, error: magicLinkError } = await db.auth.admin.generateLink({
          type: "magiclink",
          email: authEmail,
          options: {
            redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(browseUrlTracked)}`,
          },
        });
        if (!magicLinkError && magicLinkData?.properties?.action_link) {
          browseMagicLink = magicLinkData.properties.action_link;
        }
      } catch (linkErr) {
        console.error("[family-provider-silent] browse magic link failed:", linkErr);
      }

      // Generate magic links for each recommended provider
      for (const provider of recommendedProviders) {
        const providerDest = appendTrackingParams(`/provider/${provider.slug}`, emailLogId);
        let providerMagicLink = `${siteUrl}${providerDest}`; // Fallback

        try {
          const { data: magicLinkData, error: magicLinkError } = await db.auth.admin.generateLink({
            type: "magiclink",
            email: authEmail,
            options: {
              redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(providerDest)}`,
            },
          });
          if (!magicLinkError && magicLinkData?.properties?.action_link) {
            providerMagicLink = magicLinkData.properties.action_link;
          }
        } catch (linkErr) {
          console.error(`[family-provider-silent] provider magic link failed for ${provider.slug}:`, linkErr);
        }

        provider.viewUrl = providerMagicLink;
      }

      // Generate email HTML
      const emailHtml = providerSilentEmail({
        familyName: fromProfile?.display_name || "",
        providerName,
        providerPassed,
        recommendedProviders, // Now includes viewUrl with magic links
        browseUrl: browseMagicLink, // Magic link, not just tracked URL
        city: providerCity,
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

      // Metadata already updated before sending (for transaction safety)
      counts.sent++;
    }

    return {
      ok: true,
      ...counts,
    };
  });
}
