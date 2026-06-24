import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/connections/export
 *
 * Export connections as CSV for admin workflows.
 * Respects all active filters (direction, perspective, tab, date range, search).
 *
 * Query params:
 *   direction - "inbound" (default) or "outbound"
 *   perspective - "provider" or "family" (only for inbound)
 *   filter - tab filter (awaiting, viewed, connected, etc.)
 *   date_from - ISO date (inclusive)
 *   date_to - ISO date (exclusive)
 *   search - filter by family or provider name
 */

interface ConnectionRow {
  id: string;
  created_at: string;
  type: string;
  status: string | null;
  from_profile_id: string | null;
  to_profile_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  from_profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
  } | null;
  to_profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    slug: string | null;
    source_provider_id: string | null;
    city: string | null;
    state: string | null;
    account_id: string | null;
    verification_state: string | null;
  } | null;
}

// Helper to extract fields from connection metadata
function getConnectionMeta(c: ConnectionRow) {
  const meta = c.metadata ?? {};
  const thread = (meta.thread as Array<{ from_profile_id: string; text?: string; is_auto_reply?: boolean }>) ?? [];

  // Check if provider responded (sent a non-auto-reply message)
  const providerResponded = thread.some(
    (m) => m.from_profile_id === c.to_profile_id && m.text && !m.is_auto_reply
  );

  // Check if family replied after provider
  const familyReplied = providerResponded && thread.some(
    (m) => m.from_profile_id === c.from_profile_id && m.text && !m.is_auto_reply
  );

  return {
    responded: providerResponded,
    familyReplied,
    archived: meta.archived === true,
    archiveReason: (meta.archive_reason as string) ?? null,
    adminOverride: meta.admin_override as { status?: string } | null,
    providerNudgeCount: (meta.provider_nudge_count as number) ?? 0,
    followupStage: (meta.followup_stage as number) ?? null,
    followupStoppedReason: (meta.followup_stopped_reason as string) ?? null,
  };
}

export async function GET(request: NextRequest) {
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
    const direction = searchParams.get("direction") || "inbound";
    const perspective = searchParams.get("perspective") || "provider";
    const filter = searchParams.get("filter") || "all";
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const db = getServiceClient();

    // Build query
    const PAGE_SIZE = 1000;
    let allConnections: ConnectionRow[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db
        .from("connections")
        .select(`
          id,
          created_at,
          type,
          status,
          from_profile_id,
          to_profile_id,
          message,
          metadata,
          from_profile:business_profiles!connections_from_profile_id_fkey(
            id, display_name, email, phone, city
          ),
          to_profile:business_profiles!connections_to_profile_id_fkey(
            id, display_name, slug, source_provider_id, email, phone, city, state, account_id, verification_state
          )
        `)
        .order("created_at", { ascending: false });

      // Filter by direction
      if (direction === "outbound") {
        query = query.eq("type", "outreach");
      } else {
        query = query.in("type", ["inquiry", "request", "save"]);
      }

      // Date filters
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lt("created_at", dateTo);

      // Pagination
      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data: pageData, error: pageError } = await query;

      if (pageError) {
        console.error("Connections export query error:", pageError);
        return NextResponse.json({ error: "Failed to export connections" }, { status: 500 });
      }

      const rows = (pageData ?? []) as unknown as ConnectionRow[];
      allConnections = allConnections.concat(rows);
      offset += PAGE_SIZE;
      hasMore = rows.length === PAGE_SIZE;
    }

    // Apply search filter (client-side for simplicity)
    if (search) {
      allConnections = allConnections.filter((c) => {
        const familyName = c.from_profile?.display_name?.toLowerCase() || "";
        const providerName = c.to_profile?.display_name?.toLowerCase() || "";
        return familyName.includes(search) || providerName.includes(search);
      });
    }

    // Get engagement data for all connections
    const connectionIds = allConnections.map((c) => c.id);
    const connectionIdSet = new Set(connectionIds);
    const providerKeys = [
      ...new Set(
        allConnections
          .map((c) => c.to_profile?.slug || c.to_profile?.source_provider_id || c.to_profile?.id)
          .filter(Boolean)
      ),
    ] as string[];

    // ── Email delivery status tracking ──
    // Query email_log to find connections with delivery failures
    // Only mark as "failed" if the MOST RECENT email failed
    type EmailIssueType = "no_email" | "failed" | "invalid" | null;
    const connectionEmailIssueType = new Map<string, EmailIssueType>();

    const connectionsWithDeliveryFailure = new Set<string>();
    const connectionsWithSuccessfulDelivery = new Set<string>();
    const recipientsWithDeliveryFailure = new Set<string>();
    const recipientsWithSuccessfulDelivery = new Set<string>();

    if (connectionIds.length > 0) {
      // Query email_log for all provider emails to find most recent status
      const fallbackDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const queryDateFrom = dateFrom || fallbackDate;

      const { data: emailLogEntries } = await db
        .from("email_log")
        .select("metadata, status, bounced_at, created_at, recipient")
        .eq("recipient_type", "provider")
        .gte("created_at", queryDateFrom)
        .order("created_at", { ascending: false })
        .limit(5000);

      // Track most recent email per connection
      const mostRecentEmailPerConnection = new Map<string, { isFailed: boolean; timestamp: string }>();
      const mostRecentEmailPerRecipient = new Map<string, { isFailed: boolean; timestamp: string }>();

      for (const email of emailLogEntries ?? []) {
        const meta = email.metadata as Record<string, unknown> | null;
        const emailTime = email.created_at as string;
        const isFailed = email.status === "failed" || email.bounced_at != null;
        const recipient = (email.recipient as string | null)?.toLowerCase().trim();

        // Track by recipient email
        if (recipient) {
          const existing = mostRecentEmailPerRecipient.get(recipient);
          if (!existing || emailTime > existing.timestamp) {
            mostRecentEmailPerRecipient.set(recipient, { isFailed, timestamp: emailTime });
          }
        }

        // Track by connection_id
        const singleConnId = meta?.connection_id as string | undefined;
        const multiConnIds = meta?.connection_ids as string[] | undefined;
        const connIds: string[] = [];
        if (singleConnId) connIds.push(singleConnId);
        if (Array.isArray(multiConnIds)) connIds.push(...multiConnIds);

        for (const connId of connIds) {
          if (!connectionIdSet.has(connId)) continue;
          const existing = mostRecentEmailPerConnection.get(connId);
          if (!existing || emailTime > existing.timestamp) {
            mostRecentEmailPerConnection.set(connId, { isFailed, timestamp: emailTime });
          }
        }
      }

      // Build failure/success sets
      for (const [connId, { isFailed }] of mostRecentEmailPerConnection) {
        if (isFailed) {
          connectionsWithDeliveryFailure.add(connId);
        } else {
          connectionsWithSuccessfulDelivery.add(connId);
        }
      }
      for (const [recipient, { isFailed }] of mostRecentEmailPerRecipient) {
        if (isFailed) {
          recipientsWithDeliveryFailure.add(recipient);
        } else {
          recipientsWithSuccessfulDelivery.add(recipient);
        }
      }
    }

    // Query for invalid emails (verified by ZeroBounce)
    const providerEmailAddresses = new Set<string>();
    for (const c of allConnections) {
      const email = c.to_profile?.email?.trim();
      if (email) providerEmailAddresses.add(email);
    }

    const invalidEmailSet = new Set<string>();
    if (providerEmailAddresses.size > 0) {
      const emailArray = Array.from(providerEmailAddresses);
      const BATCH_SIZE = 500;
      for (let i = 0; i < emailArray.length; i += BATCH_SIZE) {
        const batch = emailArray.slice(i, i + BATCH_SIZE);
        const { data: verifications } = await db
          .from("email_verifications")
          .select("email")
          .in("email", batch)
          .eq("status", "invalid");
        for (const v of verifications ?? []) {
          if (v.email) invalidEmailSet.add(v.email);
        }
      }
    }

    // Compute email issue type for each connection
    for (const c of allConnections) {
      const providerEmail = c.to_profile?.email?.trim();
      let emailIssueType: EmailIssueType = null;

      if (!providerEmail) {
        emailIssueType = "no_email";
      } else if (connectionsWithDeliveryFailure.has(c.id)) {
        emailIssueType = "failed";
      } else {
        const recipientKey = providerEmail.toLowerCase();
        const recipientHasFailure = recipientsWithDeliveryFailure.has(recipientKey);
        const recipientHasSuccess = recipientsWithSuccessfulDelivery.has(recipientKey);
        const connectionHasSuccess = connectionsWithSuccessfulDelivery.has(c.id);

        if (recipientHasFailure && !recipientHasSuccess && !connectionHasSuccess) {
          emailIssueType = "failed";
        } else if (invalidEmailSet.has(providerEmail) && !connectionHasSuccess && !recipientHasSuccess) {
          emailIssueType = "invalid";
        }
      }

      connectionEmailIssueType.set(c.id, emailIssueType);
    }

    // Fetch engagement events
    const engagementMap = new Map<
      string,
      {
        email_clicked: boolean;
        lead_opened: boolean;
        contact_revealed: boolean;
        phone_clicked: boolean;
        email_link_clicked: boolean;
        continue_in_inbox: boolean;
      }
    >();

    if (providerKeys.length > 0 && connectionIds.length > 0) {
      // Fetch engagement events in batches to handle large exports
      const PROVIDER_BATCH_SIZE = 500;
      const allActivityEvents: { provider_id: string; event_type: string; metadata: Record<string, unknown> | null }[] = [];

      for (let i = 0; i < providerKeys.length; i += PROVIDER_BATCH_SIZE) {
        const batch = providerKeys.slice(i, i + PROVIDER_BATCH_SIZE);
        const { data: batchEvents } = await db
          .from("provider_activity")
          .select("provider_id, event_type, metadata")
          .in("provider_id", batch)
          .in("event_type", [
            "email_click",
            "lead_opened",
            "contact_revealed",
            "phone_clicked",
            "email_link_clicked",
            "continue_in_inbox",
          ])
          .limit(10000);

        if (batchEvents) {
          allActivityEvents.push(...batchEvents);
        }
      }

      for (const ev of allActivityEvents) {
        const meta = ev.metadata as Record<string, unknown> | null;
        const connId = (meta?.connection_id || meta?.lead_id) as string | undefined;
        if (!connId || !connectionIdSet.has(connId)) continue;

        let eng = engagementMap.get(connId);
        if (!eng) {
          eng = {
            email_clicked: false,
            lead_opened: false,
            contact_revealed: false,
            phone_clicked: false,
            email_link_clicked: false,
            continue_in_inbox: false,
          };
          engagementMap.set(connId, eng);
        }

        if (ev.event_type === "email_click") eng.email_clicked = true;
        else if (ev.event_type === "lead_opened") eng.lead_opened = true;
        else if (ev.event_type === "contact_revealed") eng.contact_revealed = true;
        else if (ev.event_type === "phone_clicked") eng.phone_clicked = true;
        else if (ev.event_type === "email_link_clicked") eng.email_link_clicked = true;
        else if (ev.event_type === "continue_in_inbox") eng.continue_in_inbox = true;
      }
    }

    // Calculate engagement level for each connection
    function getEngagementLevel(
      c: ConnectionRow,
      eng: { lead_opened: boolean; phone_clicked: boolean; email_link_clicked: boolean } | undefined
    ): string {
      const meta = getConnectionMeta(c);
      if (meta.adminOverride?.status === "connected") return "connected";
      if (meta.adminOverride?.status === "viewed") return "viewed";
      if (meta.responded || eng?.phone_clicked || eng?.email_link_clicked) return "connected";
      if (eng?.lead_opened) return "viewed";
      const sequenceComplete =
        (meta.followupStage != null && meta.followupStage >= 3) ||
        meta.followupStoppedReason === "needs_call";
      if (sequenceComplete) return "needs_follow_up";
      return "awaiting";
    }

    // Apply filter
    let filteredConnections = allConnections;
    if (filter !== "all") {
      filteredConnections = allConnections.filter((c) => {
        const eng = engagementMap.get(c.id);
        const level = getEngagementLevel(c, eng);
        const provider = c.to_profile;
        const meta = getConnectionMeta(c);

        // Get computed email issue type
        const emailIssue = connectionEmailIssueType.get(c.id);

        // Check if provider is claimed (has account linked)
        const isProviderClaimed = !!provider?.account_id;

        if (filter === "archived") return meta.archived;
        if (filter === "declined") return meta.archived && meta.archiveReason;
        if (filter === "awaiting") return level === "awaiting" && !meta.archived;
        if (filter === "viewed") return level === "viewed" && !meta.archived;
        if (filter === "connected") return level === "connected" && !meta.archived;
        if (filter === "needs_follow_up") return level === "needs_follow_up" && !meta.archived;

        // Needs Email: provider has NO email on file, not engaged, not claimed, not archived/declined/not-interested
        if (filter === "needs_email") {
          const hasEngaged = level === "viewed" || level === "connected";
          const isDeclined = meta.archived && meta.archiveReason;
          const isNotInterested = meta.adminOverride?.status === "not_interested";
          return emailIssue === "no_email" && !hasEngaged && !isProviderClaimed && !meta.archived && !isDeclined && !isNotInterested;
        }

        // Delivery Issues: email bounced/failed/invalid, not engaged, not claimed, not archived/declined/not-interested
        if (filter === "delivery_issues") {
          const hasEngaged = level === "viewed" || level === "connected";
          const isDeclined = meta.archived && meta.archiveReason;
          const isNotInterested = meta.adminOverride?.status === "not_interested";
          return (emailIssue === "failed" || emailIssue === "invalid") && !hasEngaged && !isProviderClaimed && !meta.archived && !isDeclined && !isNotInterested;
        }

        // Admin marked as "not interested" (but not archived)
        if (filter === "admin_not_interested") {
          return meta.adminOverride?.status === "not_interested" && !meta.archived;
        }

        // Outbound filters
        if (filter === "accepted") return c.status === "accepted";
        if (filter === "pending") return c.status !== "accepted" && c.status !== "declined";
        if (filter === "declined") return c.status === "declined";

        return true;
      });
    }

    // Build CSV
    const headers =
      direction === "outbound"
        ? [
            "Connection ID",
            "Date",
            "Family Name",
            "Family Email",
            "Family Phone",
            "Provider Name",
            "Provider Email",
            "Provider Phone",
            "Status",
            "Message Preview",
          ]
        : [
            "Connection ID",
            "Date",
            "Family Name",
            "Family Email",
            "Family Phone",
            "Family City",
            "Provider Name",
            "Provider Email",
            "Provider Phone",
            "Provider City",
            "Provider State",
            "Engagement Level",
            "Provider Responded",
            "Family Replied",
            "Provider Nudges",
            "Archived",
            "Archive Reason",
            "Provider Claimed",
            "Provider Verified",
          ];

    const lines = [headers.join(",")];

    for (const c of filteredConnections) {
      const family = c.from_profile;
      const provider = c.to_profile;
      const eng = engagementMap.get(c.id);
      const meta = getConnectionMeta(c);
      const engagementLevel = getEngagementLevel(c, eng);

      if (direction === "outbound") {
        const status = c.status === "accepted" ? "Accepted" : c.status === "declined" ? "Declined" : "Pending";
        lines.push(
          [
            csvEscape(c.id),
            c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : "",
            csvEscape(family?.display_name || ""),
            csvEscape(family?.email || ""),
            csvEscape(family?.phone || ""),
            csvEscape(provider?.display_name || ""),
            csvEscape(provider?.email || ""),
            csvEscape(provider?.phone || ""),
            csvEscape(status),
            csvEscape((c.message || "").slice(0, 100)),
          ].join(",")
        );
      } else {
        lines.push(
          [
            csvEscape(c.id),
            c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : "",
            csvEscape(family?.display_name || ""),
            csvEscape(family?.email || ""),
            csvEscape(family?.phone || ""),
            csvEscape(family?.city || ""),
            csvEscape(provider?.display_name || ""),
            csvEscape(provider?.email || ""),
            csvEscape(provider?.phone || ""),
            csvEscape(provider?.city || ""),
            csvEscape(provider?.state || ""),
            csvEscape(engagementLevel),
            meta.responded ? "Yes" : "No",
            meta.familyReplied ? "Yes" : "No",
            String(meta.providerNudgeCount),
            meta.archived ? "Yes" : "No",
            csvEscape(meta.archiveReason || ""),
            provider?.account_id ? "Yes" : "No",
            csvEscape(provider?.verification_state || ""),
          ].join(",")
        );
      }
    }

    const csv = lines.join("\n");
    const filename = `olera-connections-${direction}-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "export_connections",
      targetType: "connections",
      targetId: "bulk_export",
      details: {
        filters: { direction, perspective, filter, dateFrom, dateTo, search },
        row_count: filteredConnections.length,
      },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": String(filteredConnections.length),
      },
    });
  } catch (err) {
    console.error("Connections export error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
