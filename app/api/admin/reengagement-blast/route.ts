import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { providerFollowupDay17Email } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { generateLeadClaimUrl, generateProviderPortalUrl } from "@/lib/claim-tokens";

/**
 * POST /api/admin/reengagement-blast
 *
 * Admin-only endpoint to trigger the Day 17 re-engagement email blast
 * for stuck providers. Requires admin authentication.
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
  };

  try {
    // Find all connections at stage 5 (stuck) that haven't received stage 6 yet
    const { data: connections, error: fetchError } = await db
      .from("connections")
      .select(`
        id,
        from_profile_id,
        to_profile_id,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name, care_types, metadata),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email, city)
      `)
      .eq("type", "inquiry")
      .order("created_at", { ascending: true })
      .limit(500);

    if (fetchError) {
      console.error("[admin/reengagement-blast] Fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Get all connection IDs to check engagement
    const allConnectionIds = (connections || []).map((c) => c.id);

    // Query provider_activity for engagement events (lead_opened, contact_revealed, etc.)
    // This ensures we ONLY send to providers who have NOT engaged
    const ENGAGEMENT_EVENTS = ["lead_opened", "contact_revealed", "click_phone", "click_email", "continue_to_inbox"];
    const { data: engagementEvents, error: engagementError } = await db
      .from("provider_activity")
      .select("metadata")
      .in("event_type", ENGAGEMENT_EVENTS)
      .limit(100000);

    if (engagementError) {
      console.error("[admin/reengagement-blast] Engagement query failed:", engagementError);
      return NextResponse.json({ error: "Failed to check engagement" }, { status: 500 });
    }

    // Build set of connection IDs that have been engaged with
    const engagedConnectionIds = new Set<string>();
    const connectionIdSet = new Set(allConnectionIds);
    for (const event of engagementEvents || []) {
      const meta = event.metadata as Record<string, unknown>;
      const connId = (meta?.connection_id as string) || (meta?.lead_id as string);
      if (connId && connectionIdSet.has(connId)) {
        engagedConnectionIds.add(connId);
      }
    }

    // Filter to stuck (stage 5) OR needs_call (stage 7) connections
    // that have NOT been engaged with
    const eligibleConnections = (connections || []).filter((conn) => {
      const meta = (conn.metadata as Record<string, unknown>) || {};
      const stage = meta.followup_stage as number | undefined;

      // Must be stuck (5) or needs_call (7)
      if (stage !== 5 && stage !== 7) return false;

      // Must NOT have been engaged with
      if (engagedConnectionIds.has(conn.id)) return false;

      // Must be old enough (14+ days for stuck, 24+ days for needs_call)
      const daysSince = Math.floor((now - new Date(conn.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 14) return false;

      return true;
    });

    if (eligibleConnections.length === 0) {
      return NextResponse.json({
        ...counts,
        message: "No eligible connections found (all have been engaged or are too recent)",
        engagement_verified: true,
      });
    }

    // Group by provider
    type ProviderGroup = {
      providerId: string;
      providerEmail: string;
      providerName: string;
      providerSlug: string;
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

      const providerId = conn.to_profile_id;
      const providerSlug = (toProfile?.slug as string) || (toProfile?.source_provider_id as string) || (toProfile?.id as string) || "";
      const providerName = (toProfile?.display_name as string) || "Your Organization";
      const familyName = (fromProfile?.display_name as string) || "A family";
      const careTypes = fromProfile?.care_types as string[] | null;
      const careType = careTypes?.[0] || null;
      const city = (toProfile?.city as string) || null;
      const daysSinceInquiry = Math.floor((now - new Date(conn.created_at).getTime()) / (1000 * 60 * 60 * 24));

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
        providerGroups.set(providerId, {
          providerId,
          providerEmail,
          providerName,
          providerSlug,
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

      // Build subject
      const primaryFamilyName = group.leads[0].familyName;
      const subject = leadCount === 1
        ? (primaryFamilyName !== "A family"
            ? `${primaryFamilyName}'s request is still open`
            : "A family's request is still open")
        : `${leadCount} families are still waiting to hear from you`;

      if (dryRun) {
        counts.providers_emailed++;
        counts.leads_included += leadCount;
        continue;
      }

      // Reserve email log ID for tracking
      const emailLogId = await reserveEmailLogId({
        to: group.providerEmail,
        subject,
        emailType: "provider_followup_day17",
        recipientType: "provider",
        providerId: group.providerSlug,
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

      const html = providerFollowupDay17Email({
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
        emailType: "provider_followup_day17",
        recipientType: "provider",
        providerId: group.providerSlug,
        metadata: {
          connection_ids: group.leads.map((l) => l.connectionId),
          followup_stage: 6,
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
          followup_stage: 6,
          followup_sent_at: sentAt,
          followup_sent_by: `admin:${adminUser.email}`,
          followup_stopped_at: null,
          followup_stopped_reason: null,
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
    });
  } catch (err) {
    console.error("[admin/reengagement-blast] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
