import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { providerStillSilentEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";

/**
 * GET /api/cron/provider-still-silent
 *
 * Runs daily. Sends Email #6 to families when provider has been silent for 7+ days.
 * Trust recovery email - acknowledges failure and actively intervenes with responsive alternatives.
 *
 * Trigger conditions:
 * - Connection is 7-8 days old (168-192 hours)
 * - Provider has STILL NOT responded (no messages from provider in thread)
 * - Family engaged but was ghosted (family sent message, provider didn't respond)
 * - Email not already sent (provider_still_silent_sent_at not set)
 * - Send ONCE per FAMILY (not per connection)
 *
 * Family-level intelligence:
 * - Groups connections by family (from_profile_id)
 * - Checks ALL connections for that family
 * - If ANY provider responded ANYWHERE, skip (family has active conversations)
 * - Marks ALL 7-day-old silent connections for that family
 *
 * Difference from Email #4 (Day 4):
 * - Email #4: "while you wait" (still hoping provider will respond)
 * - Email #6: "that's on them" (giving up on provider, active intervention)
 * - Stronger language, personal support fallback
 */

export const maxDuration = 120;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

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

  return withCronRun("provider-still-silent", async () => {
    const db = getServiceClient();
    const siteUrl = getSiteUrl();
    const now = Date.now();
    const sevenDaysAgo = new Date(now - SEVEN_DAYS_MS).toISOString();
    const eightDaysAgo = new Date(now - EIGHT_DAYS_MS).toISOString();

    const counts = {
      processed: 0,
      sent: 0,
      skipped: 0,
      skipReasons: {
        provider_responded: 0,
        family_never_engaged: 0,
        already_sent: 0,
        no_email: 0,
        no_responsive_providers: 0,
        send_failed: 0,
      },
      dry_run: dryRun,
    };

    // Fetch connections that are 7-8 days old (inquiry type only)
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
      .gte("created_at", eightDaysAgo)
      .lte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("[cron/provider-still-silent] Fetch error:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!connections?.length) {
      return {
        ok: true,
        message: "No connections to process",
        ...counts,
      };
    }

    // FAMILY-LEVEL INTELLIGENCE: Group connections by family to prevent duplicate emails
    // Key: from_profile_id, Value: connection[]
    const connectionsByFamily = new Map<string, typeof connections>();
    for (const conn of connections) {
      const familyId = conn.from_profile_id;
      if (!connectionsByFamily.has(familyId)) {
        connectionsByFamily.set(familyId, []);
      }
      connectionsByFamily.get(familyId)!.push(conn);
    }

    // Process each FAMILY (not each connection)
    for (const [familyId, familyConnections] of connectionsByFamily) {
      counts.processed++;

      // Check ALL connections for this family (not just the 7-8 day batch)
      const { data: allFamilyConnections, error: familyConnError } = await db
        .from("connections")
        .select("id, from_profile_id, to_profile_id, metadata")
        .eq("from_profile_id", familyId);

      if (familyConnError) {
        console.error(
          "[cron/provider-still-silent] Error checking family connections:",
          familyConnError
        );
        counts.skipped++;
        continue;
      }

      // Check if Email #6 was already sent to this family (check ALL connections)
      let alreadySent = false;
      if (allFamilyConnections) {
        alreadySent = allFamilyConnections.some((conn) => {
          const meta = (conn.metadata || {}) as Record<string, unknown>;
          return meta.provider_still_silent_sent_at;
        });
      }

      if (alreadySent) {
        counts.skipped++;
        counts.skipReasons.already_sent++;
        continue;
      }

      // Check if ANY provider responded in ANY connection for this family
      let anyProviderResponded = false;

      if (allFamilyConnections) {
        for (const conn of allFamilyConnections) {
          const meta = (conn.metadata || {}) as Record<string, unknown>;
          const thread = (meta.thread as ThreadMessage[]) || [];

          // Check if ANY provider responded
          const providerResponded = thread.some(
            (m) =>
              m.from_profile_id === conn.to_profile_id &&
              !m.is_auto_reply &&
              m.text?.trim()
          );
          if (providerResponded) {
            anyProviderResponded = true;
            break; // Found active conversation, can stop checking
          }
        }
      }

      // Skip if ANY provider responded (family has active conversations)
      if (anyProviderResponded) {
        counts.skipped++;
        counts.skipReasons.provider_responded++;
        continue;
      }

      // Email #6 is for families who ENGAGED but were ghosted
      // IMPORTANT: Filter to engaged connections FIRST, then pick primary
      // Otherwise we might pick a connection the family never messaged
      const engagedConnections = familyConnections.filter((conn) => {
        const connMeta = (conn.metadata || {}) as Record<string, unknown>;
        const thread = (connMeta.thread as ThreadMessage[]) || [];
        return thread.some(
          (m) =>
            m.from_profile_id === conn.from_profile_id &&
            !m.is_auto_reply &&
            m.text?.trim()
        );
      });

      // Skip if family never engaged with any of the 7-8 day old connections
      if (engagedConnections.length === 0) {
        counts.skipped++;
        counts.skipReasons.family_never_engaged++;
        continue;
      }

      // Pick the FIRST engaged connection (oldest) as primary for email context
      const primaryConn = engagedConnections[0];
      const primaryMeta = (primaryConn.metadata || {}) as Record<string, unknown>;

      // Normalize joined relations
      const fromProfile = Array.isArray(primaryConn.from_profile)
        ? primaryConn.from_profile[0]
        : primaryConn.from_profile;
      const toProfile = Array.isArray(primaryConn.to_profile)
        ? primaryConn.to_profile[0]
        : primaryConn.to_profile;

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
        .neq("id", primaryConn.to_profile_id)
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

      // Check dry run BEFORE mutating database
      if (dryRun) {
        console.log(
          `[cron/provider-still-silent] [DRY RUN] Would send to ${familyEmail} for family ${familyId} with ${familyConnections.length} connections`
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

      // Subject line
      const subject = "Let's find you someone who's ready to help";

      // Reserve email log ID
      const emailLogId = await reserveEmailLogId({
        to: familyEmail,
        subject,
        emailType: "provider_still_silent",
        recipientType: "family",
        metadata: {
          connection_id: primaryConn.id,
          provider_id: primaryConn.to_profile_id,
          recommended_count: recommendedProviders.length,
          family_connection_count: familyConnections.length,
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
        console.error("[provider-still-silent] browse magic link failed:", linkErr);
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
          console.error(`[provider-still-silent] provider magic link failed for ${provider.slug}:`, linkErr);
        }

        provider.viewUrl = providerMagicLink;
      }

      // Generate email HTML
      const emailHtml = providerStillSilentEmail({
        familyName: fromProfile?.display_name || "",
        providerName,
        recommendedProviders, // Now includes viewUrl with magic links
        browseUrl: browseMagicLink, // Magic link, not just tracked URL
      });

      // Send email
      const { success, error: sendError } = await sendEmail({
        to: familyEmail,
        subject,
        html: emailHtml,
        emailType: "provider_still_silent",
        recipientType: "family",
        metadata: {
          connection_id: primaryConn.id,
          provider_id: primaryConn.to_profile_id,
          recommended_count: recommendedProviders.length,
          family_connection_count: familyConnections.length,
        },
        emailLogId: emailLogId ?? undefined,
      });

      if (!success) {
        console.error(
          `[cron/provider-still-silent] Send failed for family ${familyId}:`,
          sendError
        );
        counts.skipped++;
        counts.skipReasons.send_failed++;
        continue;
      }

      // Mark ALL 7-day-old connections for this family AFTER successful send (prevents lockout on failure)
      const sentAt = new Date().toISOString();
      for (const conn of familyConnections) {
        const connMeta = (conn.metadata || {}) as Record<string, unknown>;
        await db
          .from("connections")
          .update({
            metadata: {
              ...connMeta,
              provider_still_silent_sent_at: sentAt,
              provider_still_silent_sent_by: "cron:provider-still-silent",
              provider_still_silent_count: recommendedProviders.length,
            },
          })
          .eq("id", conn.id);
      }

      counts.sent++;
    }

    return {
      ok: true,
      ...counts,
    };
  });
}
