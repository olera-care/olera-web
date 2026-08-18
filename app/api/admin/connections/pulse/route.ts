import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";
import { isConnected, parseAdminOverride, type EngagementData } from "@/lib/connection-engagement";

/**
 * GET /api/admin/connections/pulse — hero KPI for the connections tracker.
 *
 * The canonical KPI: CONNECTED connections = provider took action to reach
 * the family. This matches the "Connected" tab count exactly.
 *
 * Connected means any of:
 *   - Provider sent a message through inbox
 *   - Provider copied phone number (phone_clicked event)
 *   - Provider copied email address (email_link_clicked event)
 *   - Family confirmed provider contacted them
 *   - Admin manually marked as connected
 *
 * Exclusions (to match the tab count exactly):
 *   - Archived connections (metadata.archived or metadata.lead_archived)
 *   - Admin-hidden connections
 *   - Admin marked "not interested"
 *   - Connections with email delivery failures (failed/bounced)
 *
 * Counted by the connection's `created_at` in the selected range.
 *
 * Same `{ total, delta, series, bucket }` contract as /api/admin/leads/stats
 * so it drops straight into <PulseHeader />.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const db = getServiceClient();

    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : now;
    const priorFrom = from ? new Date(from.getTime() - (to.getTime() - from.getTime())) : null;
    const queryStart = priorFrom ?? from ?? null;

    // Pull non-archived inquiry connections in range+prior.
    // Exclude both archived and lead_archived to match tab filtering.
    // Only inquiry connections (family→provider) are tracked here.
    // Matches (provider→family) are tracked on the Outreach page.
    let q = db
      .from("connections")
      .select("id, created_at, status, metadata, to_profile_id")
      .eq("type", "inquiry")
      .order("created_at", { ascending: true })
      .limit(50000)
      .not("metadata", "cs", JSON.stringify({ archived: true }))
      .not("metadata", "cs", JSON.stringify({ lead_archived: true }))
      .not("metadata", "cs", JSON.stringify({ admin_hidden: true }));
    if (queryStart) q = q.gte("created_at", queryStart.toISOString());
    if (dateTo) q = q.lte("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("[connections/pulse] query error:", error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const allRows = rows ?? [];
    const connectionIds = allRows.map((r) => r.id);
    const connectionIdSet = new Set(connectionIds);

    // Fetch provider engagement events (phone_clicked, email_link_clicked)
    const engagementMap = new Map<string, { phone_clicked: boolean; email_link_clicked: boolean }>();

    if (connectionIds.length > 0) {
      const { data: events } = await db
        .from("provider_events")
        .select("connection_id, event_type")
        .in("connection_id", connectionIds)
        .in("event_type", ["phone_clicked", "email_link_clicked"]);

      for (const ev of events ?? []) {
        const existing = engagementMap.get(ev.connection_id) ?? { phone_clicked: false, email_link_clicked: false };
        if (ev.event_type === "phone_clicked") existing.phone_clicked = true;
        else if (ev.event_type === "email_link_clicked") existing.email_link_clicked = true;
        engagementMap.set(ev.connection_id, existing);
      }
    }

    // Fetch email delivery failures to exclude connections with failed/bounced emails.
    // This matches the "Delivery Issues" exclusion in the main connections route.
    // We track the most recent email per connection - only exclude if the MOST RECENT failed.
    const connectionsWithDeliveryFailure = new Set<string>();

    if (connectionIds.length > 0) {
      // Query email_log for emails sent to these connections
      const fallbackDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const queryDateFrom = dateFrom || fallbackDate;

      const { data: emailLogEntries } = await db
        .from("email_log")
        .select("metadata, status, bounced_at, created_at")
        .eq("recipient_type", "provider")
        .gte("created_at", queryDateFrom)
        .order("created_at", { ascending: false })
        .limit(10000);

      // Track the most recent email per connection
      const mostRecentEmailPerConnection = new Map<string, { isFailed: boolean; timestamp: string }>();

      for (const email of emailLogEntries ?? []) {
        const meta = email.metadata as Record<string, unknown> | null;
        const emailTime = email.created_at as string;
        const isFailed = email.status === "failed" || email.bounced_at != null;

        // Extract connection IDs from metadata
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

      // Mark connections whose most recent email failed
      for (const [connId, { isFailed }] of mostRecentEmailPerConnection) {
        if (isFailed) {
          connectionsWithDeliveryFailure.add(connId);
        }
      }
    }

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t <= to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    type ThreadMsg = { from_profile_id: string; text?: string; created_at?: string; is_auto_reply?: boolean; type?: string };

    // Helper to check if provider messaged (real message, not auto-reply)
    const providerMessaged = (r: (typeof allRows)[0]): boolean => {
      const meta = (r.metadata as Record<string, unknown>) ?? {};
      const thread = (meta.thread as ThreadMsg[]) || [];
      return thread.some(
        (m) =>
          m.from_profile_id === r.to_profile_id &&
          m.is_auto_reply !== true &&
          m.type !== "system" &&
          m.from_profile_id !== "system" &&
          !!m.text?.trim()
      );
    };

    let kpiCurrent = 0;
    let kpiPrior = 0;
    const successTimestamps: Date[] = [];
    for (const r of allRows) {
      const meta = (r.metadata as Record<string, unknown>) ?? {};
      const adminOverride = parseAdminOverride(meta.admin_override);

      // Exclude: admin marked "not interested" (matches tab filtering)
      if (adminOverride?.status === "not_interested") continue;

      // Exclude: connections with delivery failures (matches "Delivery Issues" tab exclusion)
      if (connectionsWithDeliveryFailure.has(r.id)) continue;

      const eng = engagementMap.get(r.id);

      // Build engagement data matching isConnected() requirements
      const engagement: Pick<EngagementData, "adminMarkedConnected" | "providerMessaged" | "phoneClicked" | "emailLinkClicked" | "familyConfirmed"> = {
        adminMarkedConnected: adminOverride?.status === "connected",
        providerMessaged: providerMessaged(r),
        phoneClicked: eng?.phone_clicked ?? false,
        emailLinkClicked: eng?.email_link_clicked ?? false,
        familyConfirmed: meta.family_confirmed === true,
      };

      if (!isConnected(engagement as EngagementData)) continue;

      const t = new Date(r.created_at);
      if (inRange(t)) {
        kpiCurrent++;
        successTimestamps.push(t);
      } else if (inPrior(t)) {
        kpiPrior++;
      }
    }

    let delta: number | null = null;
    if (from) {
      if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
      else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
    }

    const bucket: Bucket = from
      ? resolveBucket(from, to)
      : resolveBucket(successTimestamps[0] ?? now, now);
    const seriesStart = from ?? successTimestamps[0] ?? now;
    const series = buildSeries(successTimestamps, seriesStart, to, bucket);

    // Calculate response metrics from all rows in range
    let respondedCount = 0;
    let awaitingCount = 0;
    const responseTimes: number[] = [];

    for (const r of allRows) {
      const t = new Date(r.created_at);
      if (!inRange(t)) continue;

      const meta = (r.metadata as Record<string, unknown>) ?? {};
      const thread = (meta.thread as ThreadMsg[]) || [];
      // Find REAL provider response (non-auto, non-system, with actual text)
      const providerMsg = thread.find(
        (m) =>
          m.from_profile_id === r.to_profile_id &&
          m.is_auto_reply !== true &&
          m.type !== "system" &&
          m.from_profile_id !== "system" &&
          !!m.text?.trim()
      );

      if (providerMsg) {
        respondedCount++;
        if (providerMsg.created_at) {
          const responseTimeHours =
            (new Date(providerMsg.created_at).getTime() - new Date(r.created_at).getTime()) /
            (1000 * 60 * 60);
          if (responseTimeHours > 0) responseTimes.push(responseTimeHours);
        }
      } else {
        awaitingCount++;
      }
    }

    const totalInRange = respondedCount + awaitingCount;
    const responseRate = totalInRange > 0 ? Math.round((respondedCount / totalInRange) * 100) : 0;

    let medianResponseTime: number | null = null;
    if (responseTimes.length > 0) {
      responseTimes.sort((a, b) => a - b);
      const mid = Math.floor(responseTimes.length / 2);
      medianResponseTime =
        responseTimes.length % 2 === 0
          ? Math.round(((responseTimes[mid - 1] + responseTimes[mid]) / 2) * 10) / 10
          : Math.round(responseTimes[mid] * 10) / 10;
    }

    return NextResponse.json({
      total: kpiCurrent,
      delta,
      series,
      bucket,
      // Response metrics
      responseRate,
      medianResponseTime,
      awaitingCount,
    });
  } catch (err) {
    console.error("[connections/pulse] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
