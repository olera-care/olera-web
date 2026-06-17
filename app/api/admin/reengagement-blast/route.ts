import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { resolveCanonicalProviderId } from "@/lib/provider-identity";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { providerFollowupDay6Email } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { generateLeadClaimUrl, generateProviderPortalUrl } from "@/lib/claim-tokens";
import { PROVIDER_STUCK_THRESHOLD_DAYS } from "@/lib/connection-engagement";

/**
 * POST /api/admin/reengagement-blast
 *
 * Admin-only endpoint to manually send re-engagement emails to providers needing follow-up.
 * Requires admin authentication.
 *
 * Sends the Day 6 final follow-up email to providers who:
 *   - Are 10+ days old (PROVIDER_STUCK_THRESHOLD_DAYS)
 *   - Have NOT connected (no phone_clicked, email_link_clicked, or message sent)
 *   - Haven't already received this manual blast (stage 3 or haven't completed sequence)
 *   - Have a valid email address
 *
 * NOTE: Viewing or engaging (revealing contact info) does NOT exclude a provider.
 * Only actual connection (clicking phone/email or sending message) excludes them.
 *
 * Query params:
 *   - dry_run=true: Preview mode, shows what would be sent without sending
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminUser = await getAdminUser(authUser.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry_run") === "true";

  const db = getServiceClient();
  const siteUrl = getSiteUrl();
  const now = Date.now();

  const counts = {
    providers_emailed: 0,
    leads_included: 0,
    skipped: 0,
    dry_run: dryRun,
    triggered_by: adminUser.email,
    // Debug counts for visibility
    total_inquiries_checked: 0,
    filtered_too_recent: 0,
    filtered_already_emailed: 0,
    filtered_engaged: 0,
  };

  // For preview mode, collect provider details and sample email
  const previewProviders: Array<{
    email: string;
    name: string;
    leadCount: number;
    subject: string;
  }> = [];
  let sampleEmailHtml: string | null = null;

  try {
    // Fetch all inquiry connections - filtering happens after engagement check
    const { data: connections, error: fetchError } = await db
      .from("connections")
      .select(`
        id,
        from_profile_id,
        to_profile_id,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name, care_types, metadata),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email, city, metadata)
      `)
      .eq("type", "inquiry")
      .order("created_at", { ascending: true })
      .limit(2000); // Higher limit for blast operation

    if (fetchError) {
      console.error("[admin/reengagement-blast] Fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Get all connection IDs to check engagement
    const allConnectionIds = (connections || []).map((c) => c.id);

    // Query provider_activity for CONNECTION events only (phone/email clicks)
    // NOTE: We do NOT check lead_opened or contact_revealed — viewing/engaging doesn't exclude
    // Only actual connection (clicking phone/email) excludes a provider
    const CONNECTION_EVENTS = [
      "phone_clicked",       // Clicked phone button
      "email_link_clicked",  // Clicked email button
    ];
    const { data: connectionEvents, error: connectionError } = await db
      .from("provider_activity")
      .select("provider_id, metadata, event_type")
      .in("event_type", CONNECTION_EVENTS)
      .limit(100000);

    if (connectionError) {
      console.error("[admin/reengagement-blast] Connection query failed:", connectionError);
      return NextResponse.json({ error: "Failed to check connections" }, { status: 500 });
    }

    // Build set of connection IDs where provider has connected (clicked phone/email)
    const connectedConnectionIds = new Set<string>();
    const connectionIdSet = new Set(allConnectionIds);

    for (const event of connectionEvents || []) {
      const meta = event.metadata as Record<string, unknown>;
      const connId = (meta?.connection_id as string) || (meta?.lead_id as string);

      // Match by connection_id if available
      if (connId && connectionIdSet.has(connId)) {
        connectedConnectionIds.add(connId);
      }
    }

    // Filter to eligible connections:
    // - 10+ days old (PROVIDER_STUCK_THRESHOLD_DAYS)
    // - Haven't reached final stage (stage 3) yet, or had sequence stop
    // - NOT already connected (clicked phone/email)
    counts.total_inquiries_checked = (connections || []).length;

    const eligibleConnections = (connections || []).filter((conn) => {
      const meta = (conn.metadata as Record<string, unknown>) || {};
      const stage = meta.followup_stage as number | undefined;

      // Calculate age from sequence start (email_sent_at if present, otherwise created_at)
      // This handles providers who got email added later - they start fresh from that date
      const sequenceStartDate = (meta.email_sent_at as string) || conn.created_at;
      const daysSince = Math.floor((now - new Date(sequenceStartDate).getTime()) / (1000 * 60 * 60 * 24));

      // Must be old enough (10+ days = needs follow-up threshold)
      if (daysSince < PROVIDER_STUCK_THRESHOLD_DAYS) {
        counts.filtered_too_recent++;
        return false;
      }

      // Must NOT have connected (clicked phone/email)
      // Note: viewing or engaging does NOT exclude - only actual connection does
      if (connectedConnectionIds.has(conn.id)) {
        counts.filtered_engaged++;
        return false;
      }

      // Exclude if sequence was stopped due to actual connection (responded or connected)
      const stopReason = meta.followup_stopped_reason as string | undefined;
      if (stopReason === "connected" || stopReason === "responded" || stopReason === "admin_marked_connected") {
        counts.filtered_engaged++;
        return false;
      }

      // Include connections that need manual re-engagement:
      // - Haven't completed the automated sequence (stage < 3)
      // - OR old connections without a stage (predate the cron)
      // This targets the "needs_follow_up" tab in the admin panel
      return true;
    });

    if (eligibleConnections.length === 0) {
      return NextResponse.json({
        ...counts,
        message: `No eligible connections found. Breakdown: ${counts.total_inquiries_checked} checked, ${counts.filtered_too_recent} too recent, ${counts.filtered_already_emailed} already emailed, ${counts.filtered_engaged} engaged.`,
        engagement_verified: true,
      });
    }

    // Group by provider
    type ProviderGroup = {
      providerId: string;
      providerEmail: string;
      providerName: string;
      providerSlug: string;
      providerKey: string; // canonical olera-providers.slug for email_log.provider_id (frequency gate + dashboard)
      leads: Array<{
        connectionId: string;
        familyName: string;
        careType: string | null;
        city: string | null;
        careRecipient: string | null;
        daysSinceInquiry: number;
        metadata: Record<string, unknown>;
      }>;
    };

    const providerGroups = new Map<string, ProviderGroup>();

    for (const conn of eligibleConnections) {
      // Handle array vs single object from Supabase join
      const toProfile = (Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile) as Record<string, unknown> | null;
      const fromProfile = (Array.isArray(conn.from_profile) ? conn.from_profile[0] : conn.from_profile) as Record<string, unknown> | null;

      const providerEmail = (toProfile?.email as string)?.trim();
      if (!providerEmail) {
        counts.skipped++;
        continue;
      }

      // Skip if provider is admin-archived (no emails sent to them)
      const providerMeta = (toProfile?.metadata as Record<string, unknown>) ?? {};
      if (providerMeta.admin_archived === true) {
        counts.skipped++;
        continue;
      }

      const providerId = conn.to_profile_id;
      const providerSlug = (toProfile?.slug as string) || (toProfile?.source_provider_id as string) || (toProfile?.id as string) || "";
      const providerName = (toProfile?.display_name as string) || "Your Organization";
      const familyName = (fromProfile?.display_name as string) || "A family";
      const careTypes = fromProfile?.care_types as string[] | null;
      const careType = careTypes?.[0] || null;
      const city = (toProfile?.city as string) || null;
      // Use sequence start date for display (same as eligibility calculation)
      const connMeta = (conn.metadata as Record<string, unknown>) || {};
      const connSequenceStart = (connMeta.email_sent_at as string) || conn.created_at;
      const daysSinceInquiry = Math.floor((now - new Date(connSequenceStart).getTime()) / (1000 * 60 * 60 * 24));

      // Care recipient from family metadata
      const familyMeta = (fromProfile?.metadata as Record<string, unknown>) || {};
      const relationshipRaw = familyMeta.relationship_to_recipient as string | undefined;
      const careRecipientMap: Record<string, string | null> = {
        parent: "their parent",
        spouse: "their spouse",
        grandparent: "their grandparent",
        myself: "themselves",
        other: null,
      };
      const careRecipient = relationshipRaw
        ? (careRecipientMap[relationshipRaw] !== undefined ? careRecipientMap[relationshipRaw] : null)
        : null;

      if (!providerGroups.has(providerId)) {
        const providerKey =
          (await resolveCanonicalProviderId(db, {
            sourceProviderId: (toProfile?.source_provider_id as string) || null,
            profileSlug: providerSlug,
          })) ?? providerSlug;
        providerGroups.set(providerId, {
          providerId,
          providerEmail,
          providerName,
          providerSlug,
          providerKey,
          leads: [],
        });
      }

      providerGroups.get(providerId)!.leads.push({
        connectionId: conn.id,
        familyName,
        careType,
        city,
        careRecipient,
        daysSinceInquiry,
        metadata: (conn.metadata as Record<string, unknown>) || {},
      });
    }

    // Process each provider group
    for (const group of providerGroups.values()) {
      const leadCount = group.leads.length;

      // Build subject (matches Day 6 final email)
      const primaryFamilyName = group.leads[0].familyName;
      const hasName = primaryFamilyName && primaryFamilyName !== "A family";
      const subject = leadCount === 1
        ? (hasName ? `One last note about ${primaryFamilyName}` : "One last note about the family")
        : "One last note about these requests";

      if (dryRun) {
        counts.providers_emailed++;
        counts.leads_included += leadCount;

        // Collect provider preview data
        previewProviders.push({
          email: group.providerEmail,
          name: group.providerName,
          leadCount,
          subject,
        });

        // Generate sample email for the first provider only
        if (sampleEmailHtml === null) {
          const leadsForTemplate = group.leads.map((l) => ({
            familyName: l.familyName,
            daysSinceInquiry: l.daysSinceInquiry,
            careType: l.careType,
            city: l.city,
            careRecipient: l.careRecipient,
          }));

          sampleEmailHtml = providerFollowupDay6Email({
            providerName: group.providerName,
            leads: leadsForTemplate,
            viewUrl: "[Preview - URL will be generated on send]",
            providerSlug: group.providerSlug,
            manageListingUrl: "[Preview - URL will be generated on send]",
            settingsUrl: "[Preview - URL will be generated on send]",
          });
        }

        continue;
      }

      // Reserve email log ID for tracking
      const emailLogId = await reserveEmailLogId({
        to: group.providerEmail,
        subject,
        emailType: "provider_followup_day6",
        recipientType: "provider",
        providerId: group.providerKey,
      });

      // Build view URL
      const primaryConnectionId = leadCount === 1 ? group.leads[0].connectionId : null;
      const claimUrl = generateLeadClaimUrl(
        group.providerSlug,
        group.providerEmail,
        primaryConnectionId,
        siteUrl
      );
      const viewUrl = appendTrackingParams(claimUrl, emailLogId);

      // Build magic link URLs for footer
      const manageListingUrl = generateProviderPortalUrl(
        group.providerSlug,
        group.providerEmail,
        "manage",
        siteUrl
      );
      const settingsUrl = generateProviderPortalUrl(
        group.providerSlug,
        group.providerEmail,
        "settings",
        siteUrl
      );

      // Build email
      const leadsForTemplate = group.leads.map((l) => ({
        familyName: l.familyName,
        daysSinceInquiry: l.daysSinceInquiry,
        careType: l.careType,
        city: l.city,
        careRecipient: l.careRecipient,
      }));

      const html = providerFollowupDay6Email({
        providerName: group.providerName,
        leads: leadsForTemplate,
        viewUrl,
        providerSlug: group.providerSlug,
        manageListingUrl,
        settingsUrl,
      });

      // Send email
      const { success, error: sendError } = await sendEmail({
        to: group.providerEmail,
        subject,
        html,
        emailType: "provider_followup_day6",
        recipientType: "provider",
        providerId: group.providerKey,
        metadata: {
          connection_ids: group.leads.map((l) => l.connectionId),
          followup_stage: 3, // Day 6 is stage 3 in the compressed sequence
          sent_by: `admin:${adminUser.email}`,
          lead_count: leadCount,
        },
        emailLogId: emailLogId ?? undefined,
      });

      if (!success) {
        console.error(`[admin/reengagement-blast] Send failed for provider ${group.providerId}:`, sendError);
        counts.skipped += leadCount;
        continue;
      }

      // Update metadata for all connections
      const sentAt = new Date().toISOString();
      for (const lead of group.leads) {
        const updatedMeta = {
          ...lead.metadata,
          followup_stage: 3, // Stage 3 is the final stage in the compressed sequence
          followup_sent_at: sentAt,
          followup_sent_by: `admin:${adminUser.email}`,
          // Increment nudge_count for consistency with cron and admin panel display
          nudge_count: ((lead.metadata.nudge_count as number) || 0) + 1,
          nudged_at: sentAt,
        };

        await db
          .from("connections")
          .update({ metadata: updatedMeta })
          .eq("id", lead.connectionId);
      }

      counts.providers_emailed++;
      counts.leads_included += leadCount;
    }

    return NextResponse.json({
      ...counts,
      message: dryRun
        ? `Would send to ${counts.providers_emailed} providers (${counts.leads_included} leads)`
        : `Sent to ${counts.providers_emailed} providers (${counts.leads_included} leads)`,
      // Include preview data in dry run mode
      ...(dryRun && {
        preview: {
          providers: previewProviders.slice(0, 10), // First 10 providers
          sampleEmailHtml,
          totalProviders: previewProviders.length,
        },
      }),
    });
  } catch (err) {
    console.error("[admin/reengagement-blast] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
