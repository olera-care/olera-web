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
  from_profile_id: string | null;
  to_profile_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  responded: boolean;
  family_replied_after_provider: boolean;
  provider_nudge_count: number;
  family_nudge_count: number;
  archived: boolean;
  archive_reason: string | null;
  archived_at: string | null;
  admin_override: Record<string, unknown> | null;
  followup_stage: number | null;
  followup_stopped_reason: string | null;
  from_profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
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
          from_profile_id,
          to_profile_id,
          message,
          metadata,
          responded,
          family_replied_after_provider,
          provider_nudge_count,
          family_nudge_count,
          archived,
          archive_reason,
          archived_at,
          admin_override,
          followup_stage,
          followup_stopped_reason,
          from_profile:business_profiles!connections_from_profile_id_fkey (
            id,
            display_name,
            email,
            phone,
            city,
            state
          ),
          to_profile:business_profiles!connections_to_profile_id_fkey (
            id,
            display_name,
            email,
            phone,
            slug,
            source_provider_id,
            city,
            state,
            account_id,
            verification_state
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
    const providerKeys = [
      ...new Set(
        allConnections
          .map((c) => c.to_profile?.slug || c.to_profile?.source_provider_id || c.to_profile?.id)
          .filter(Boolean)
      ),
    ] as string[];

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
        if (!connId || !connectionIds.includes(connId)) continue;

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
      const adminOverride = c.admin_override as { status?: string } | null;
      if (adminOverride?.status === "connected") return "connected";
      if (adminOverride?.status === "viewed") return "viewed";
      if (c.responded || eng?.phone_clicked || eng?.email_link_clicked) return "connected";
      if (eng?.lead_opened) return "viewed";
      const sequenceComplete =
        (c.followup_stage != null && c.followup_stage >= 3) ||
        c.followup_stopped_reason === "needs_call";
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
        const adminOverride = c.admin_override as { status?: string } | null;

        // Check for email issues (no email, or email looks invalid)
        const providerEmail = provider?.email?.trim();
        const hasEmailIssue = !providerEmail || !providerEmail.includes("@");

        // Check if provider is claimed (has account linked)
        const isProviderClaimed = !!provider?.account_id;

        if (filter === "archived") return c.archived;
        if (filter === "declined") return c.archived && c.archive_reason;
        if (filter === "awaiting") return level === "awaiting" && !c.archived;
        if (filter === "viewed") return level === "viewed" && !c.archived;
        if (filter === "connected") return level === "connected" && !c.archived;
        if (filter === "needs_follow_up") return level === "needs_follow_up" && !c.archived;

        // Needs Email: has email issue, not engaged, not claimed, not archived
        if (filter === "needs_email") {
          const hasEngaged = level === "viewed" || level === "connected";
          return hasEmailIssue && !hasEngaged && !isProviderClaimed && !c.archived;
        }

        // Admin marked as "not interested" (but not archived)
        if (filter === "admin_not_interested") {
          return adminOverride?.status === "not_interested" && !c.archived;
        }

        // Outbound filters
        if (filter === "accepted") return c.responded === true;
        if (filter === "pending") return c.responded !== true && !c.archived;
        // filter === "declined" handled above

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
      const engagementLevel = getEngagementLevel(c, eng);

      if (direction === "outbound") {
        const status = c.responded ? "Accepted" : c.archived ? "Declined" : "Pending";
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
            c.responded ? "Yes" : "No",
            c.family_replied_after_provider ? "Yes" : "No",
            String(c.provider_nudge_count || 0),
            c.archived ? "Yes" : "No",
            csvEscape(c.archive_reason || ""),
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
