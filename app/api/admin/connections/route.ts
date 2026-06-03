import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  getConnectionTemperature,
  INTERVENTION_PRIORITY,
  isSuccessfulConnection,
  type ConnectionTemperatureState,
} from "@/lib/connection-temperature";

/**
 * GET /api/admin/connections — rows for the connections tracker's
 * intervention queue, each tagged with its temperature (whose-turn + staleness)
 * and sorted most-needs-attention first.
 *
 * Query params:
 *   - state          one of awaiting_provider|awaiting_family|live|going_cold|closed (filter)
 *   - include_closed "true" to include declined/expired/ended connections (default: excluded)
 *   - search         case-insensitive match on family or provider display name
 *   - date_from/to   filter by connection created_at
 *   - limit/offset   pagination (default 50 / 0)
 *   - tab            action queue tab: nudge_provider|nudge_family|call_no_email|hot_leads
 *
 * Temperature is computed in-memory (the thread lives in metadata JSONB, so it
 * can't be a SQL filter) over a capped active set, exactly like the needs-email
 * path in /api/admin/leads. Returns `counts` over the full set (pre-pagination,
 * pre-state-filter) so the UI can label its sections.
 *
 * Enhanced for monetization dashboard: includes engagement timeline, heat scores,
 * and action queue counts.
 */
const FETCH_CAP = 3000;

// Heat score weights for identifying hot leads
const HEAT_WEIGHTS = {
  contact_revealed: 40,
  claim_completed: 30,
  one_click_access: 25,
  lead_opened: 20,
  email_click: 10,
} as const;

const HOT_LEAD_THRESHOLD = 50;
const RECENT_DAYS = 3;
const COLD_DAYS = 7;

// Days after which a nudge can be sent again
const NUDGE_COOLDOWN_DAYS = 3;

type ProfileJoin =
  | { id?: string; display_name?: string | null; slug?: string | null; source_provider_id?: string | null; email?: string | null; type?: string | null; claim_state?: string | null }[]
  | { id?: string; display_name?: string | null; slug?: string | null; source_provider_id?: string | null; email?: string | null; type?: string | null; claim_state?: string | null }
  | null;

function one(p: ProfileJoin) {
  return Array.isArray(p) ? p[0] : p;
}

type ActionTab = "nudge_provider" | "nudge_family" | "call_no_email" | "hot_leads";

interface EngagementTimeline {
  email_sent_at: string | null;
  email_delivered_at: string | null;
  email_opened_at: string | null;
  email_clicked_at: string | null;
  lead_opened_at: string | null;
  contact_revealed_at: string | null;
  account_claimed_at: string | null;
  one_click_at: string | null;
  first_response_at: string | null;
}

interface ProviderActivity {
  provider_id: string;
  event_type: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const stateFilter = searchParams.get("state") as ConnectionTemperatureState | null;
    const tabFilter = searchParams.get("tab") as ActionTab | null;
    const includeClosed = searchParams.get("include_closed") === "true";
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Number(searchParams.get("offset")) || 0;

    const db = getServiceClient();

    let q = db
      .from("connections")
      .select(`
        id,
        type,
        status,
        message,
        metadata,
        created_at,
        from_profile_id,
        to_profile_id,
        from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, type, email, phone),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email, is_active, claim_state)
      `)
      .eq("type", "inquiry")
      .order("created_at", { ascending: false })
      .limit(FETCH_CAP)
      .not("metadata", "cs", JSON.stringify({ archived: true }));
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("[connections] query error:", error);
      return NextResponse.json({ error: "Failed to load connections" }, { status: 500 });
    }

    const now = Date.now();

    // Collect all provider activity keys for batch query
    const allProviderKeys = new Set<string>();
    const rawMapped = (rows ?? []).map((r) => {
      const family = one(r.from_profile as ProfileJoin);
      const provider = one(r.to_profile as ProfileJoin);
      const activityKey = provider?.slug || provider?.source_provider_id || provider?.id || null;
      if (activityKey) allProviderKeys.add(activityKey);
      return { r, family, provider, activityKey };
    });

    // Batch fetch provider activity for engagement timelines
    // Note: This fetches activity at the provider level, not connection level.
    // If a provider has multiple leads, engagement signals may appear on all of them.
    // This is acceptable for identifying "engaged providers" but may be misleading
    // in the per-connection timeline view.
    const activityMap = new Map<string, ProviderActivity[]>();
    if (allProviderKeys.size > 0) {
      const { data: activities } = await db
        .from("provider_activity")
        .select("provider_id, event_type, created_at")
        .in("provider_id", Array.from(allProviderKeys))
        .in("event_type", ["email_click", "lead_opened", "contact_revealed", "one_click_access", "claim_completed"])
        .order("created_at", { ascending: false })
        .limit(10000); // Cap to prevent memory issues

      for (const a of activities ?? []) {
        if (!activityMap.has(a.provider_id)) activityMap.set(a.provider_id, []);
        activityMap.get(a.provider_id)!.push(a);
      }
    }

    // Batch fetch email_log for email engagement data
    const emailLogMap = new Map<string, { first_opened_at: string | null; first_clicked_at: string | null; delivered_at: string | null; created_at: string | null }>();
    if (allProviderKeys.size > 0) {
      const { data: emailLogs } = await db
        .from("email_log")
        .select("provider_id, first_opened_at, first_clicked_at, delivered_at, created_at")
        .in("provider_id", Array.from(allProviderKeys))
        .in("email_type", ["question_received", "connection_request", "add_email_notification", "guest_connection"])
        .order("created_at", { ascending: false })
        .limit(10000); // Cap to prevent memory issues

      for (const log of emailLogs ?? []) {
        // Keep most recent email data for each provider
        const existing = emailLogMap.get(log.provider_id);
        if (!existing || (log.created_at && (!existing.created_at || new Date(log.created_at) > new Date(existing.created_at)))) {
          emailLogMap.set(log.provider_id, {
            first_opened_at: log.first_opened_at,
            first_clicked_at: log.first_clicked_at,
            delivered_at: log.delivered_at,
            created_at: log.created_at,
          });
        }
      }
    }

    // Helper to calculate heat score
    const calculateHeatScore = (activityKey: string | null, createdAt: string): { score: number; engagement: EngagementTimeline } => {
      const defaultEngagement: EngagementTimeline = {
        email_sent_at: null,
        email_delivered_at: null,
        email_opened_at: null,
        email_clicked_at: null,
        lead_opened_at: null,
        contact_revealed_at: null,
        account_claimed_at: null,
        one_click_at: null,
        first_response_at: null,
      };

      if (!activityKey) return { score: 0, engagement: defaultEngagement };

      const activities = activityMap.get(activityKey) || [];
      const emailLog = emailLogMap.get(activityKey);

      const engagement: EngagementTimeline = {
        email_sent_at: emailLog?.created_at ?? null,
        email_delivered_at: emailLog?.delivered_at ?? null,
        email_opened_at: emailLog?.first_opened_at ?? null,
        email_clicked_at: null,
        lead_opened_at: null,
        contact_revealed_at: null,
        account_claimed_at: null,
        one_click_at: null,
        first_response_at: null,
      };

      let latestEngagement = new Date(createdAt).getTime();

      // Build engagement timeline from activities (keeping earliest timestamp per event)
      for (const a of activities) {
        const ts = new Date(a.created_at).getTime();
        if (ts > latestEngagement) latestEngagement = ts;

        switch (a.event_type) {
          case "email_click":
            if (!engagement.email_clicked_at || new Date(a.created_at) < new Date(engagement.email_clicked_at)) {
              engagement.email_clicked_at = a.created_at;
            }
            break;
          case "lead_opened":
            if (!engagement.lead_opened_at || new Date(a.created_at) < new Date(engagement.lead_opened_at)) {
              engagement.lead_opened_at = a.created_at;
            }
            break;
          case "contact_revealed":
            if (!engagement.contact_revealed_at || new Date(a.created_at) < new Date(engagement.contact_revealed_at)) {
              engagement.contact_revealed_at = a.created_at;
            }
            break;
          case "one_click_access":
            if (!engagement.one_click_at || new Date(a.created_at) < new Date(engagement.one_click_at)) {
              engagement.one_click_at = a.created_at;
            }
            break;
          case "claim_completed":
            if (!engagement.account_claimed_at || new Date(a.created_at) < new Date(engagement.account_claimed_at)) {
              engagement.account_claimed_at = a.created_at;
            }
            break;
        }
      }

      // Calculate heat score by accumulating weights for each engagement signal
      let baseScore = 0;
      if (engagement.email_clicked_at) baseScore += HEAT_WEIGHTS.email_click;
      if (engagement.lead_opened_at) baseScore += HEAT_WEIGHTS.lead_opened;
      if (engagement.contact_revealed_at) baseScore += HEAT_WEIGHTS.contact_revealed;
      if (engagement.one_click_at) baseScore += HEAT_WEIGHTS.one_click_access;
      if (engagement.account_claimed_at) baseScore += HEAT_WEIGHTS.claim_completed;

      // Apply time multiplier
      const daysSinceEngagement = Math.floor((now - latestEngagement) / (1000 * 60 * 60 * 24));
      let multiplier = 1;
      if (daysSinceEngagement < RECENT_DAYS) multiplier = 2;
      else if (daysSinceEngagement > COLD_DAYS) multiplier = 0.5;

      return { score: Math.round(baseScore * multiplier), engagement };
    };

    const all = rawMapped.map(({ r, family, provider, activityKey }) => {
      const temperature = getConnectionTemperature(
        {
          from_profile_id: r.from_profile_id ?? "",
          to_profile_id: r.to_profile_id ?? "",
          status: r.status,
          created_at: r.created_at,
          metadata: r.metadata,
        },
        now
      );

      const { score: heatScore, engagement } = calculateHeatScore(activityKey, r.created_at);
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const nudgedAt = meta.nudged_at as string | null;
      const familyNudgedAt = meta.family_nudged_at as string | null;
      const isResponded = isSuccessfulConnection(r);

      // Determine if nudge is recently sent (within cooldown)
      const isRecentlyNudged = nudgedAt
        ? (now - new Date(nudgedAt).getTime()) < NUDGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
        : false;
      const isFamilyRecentlyNudged = familyNudgedAt
        ? (now - new Date(familyNudgedAt).getTime()) < NUDGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
        : false;

      return {
        id: r.id,
        type: r.type,
        status: r.status,
        created_at: r.created_at,
        family: {
          id: family?.id,
          display_name: family?.display_name ?? null,
          email: (family as { email?: string })?.email ?? null,
          phone: (family as { phone?: string })?.phone ?? null,
        },
        provider: {
          id: provider?.id,
          display_name: provider?.display_name ?? null,
          slug: provider?.slug ?? null,
          source_provider_id: provider?.source_provider_id ?? null,
          email: provider?.email ?? null,
          activityKey,
          claim_state: provider?.claim_state ?? null,
        },
        temperature,
        // NEW: Enhanced engagement data
        engagement,
        heat_score: heatScore,
        is_hot_lead: heatScore >= HOT_LEAD_THRESHOLD && !isResponded,
        is_responded: isResponded,
        provider_claimed: provider?.claim_state === "claimed",
        provider_claim_state: provider?.claim_state ?? "unclaimed",
        // Nudge state
        nudged_at: nudgedAt,
        family_nudged_at: familyNudgedAt,
        is_recently_nudged: isRecentlyNudged,
        is_family_recently_nudged: isFamilyRecentlyNudged,
      };
    });

    // Search filter (family or provider name) — applied to the full set.
    const searched = search
      ? all.filter(
          (c) =>
            (c.family.display_name || "").toLowerCase().includes(search) ||
            (c.provider.display_name || "").toLowerCase().includes(search)
        )
      : all;

    // Counts across the searched set (every state), for section labels.
    const counts: Record<ConnectionTemperatureState, number> = {
      awaiting_provider: 0,
      awaiting_family: 0,
      live: 0,
      going_cold: 0,
      closed: 0,
    };
    for (const c of searched) counts[c.temperature.state]++;

    // Action queue counts (for the new tabs)
    const actionCounts = {
      nudge_provider: 0,
      nudge_family: 0,
      call_no_email: 0,
      hot_leads: 0,
    };

    // Helper functions for tab filtering
    const isNudgeProvider = (c: typeof all[0]) =>
      !c.is_responded &&
      c.provider.email &&
      !c.is_recently_nudged &&
      !c.is_hot_lead &&
      c.temperature.state !== "closed";

    const isNudgeFamily = (c: typeof all[0]) =>
      c.is_responded &&
      c.temperature.state === "awaiting_family" &&
      !c.is_family_recently_nudged;

    const isCallNoEmail = (c: typeof all[0]) =>
      !c.is_responded &&
      !c.provider.email &&
      c.temperature.state !== "closed";

    const isHotLead = (c: typeof all[0]) =>
      c.is_hot_lead;

    // Calculate action counts
    for (const c of searched) {
      if (isNudgeProvider(c)) actionCounts.nudge_provider++;
      if (isNudgeFamily(c)) actionCounts.nudge_family++;
      if (isCallNoEmail(c)) actionCounts.call_no_email++;
      if (isHotLead(c)) actionCounts.hot_leads++;
    }

    // Returned list:
    //   - explicit `state`     → exactly that state (e.g. the Live / Closed tabs)
    //   - explicit `tab`       → action queue tab filter
    //   - `include_closed`     → everything
    //   - default ("queue")    → only states that need attention: going_cold +
    //                            awaiting_provider + awaiting_family. `live` and
    //                            `closed` are excluded so the intervention queue
    //                            never mixes in healthy/finished connections.
    let list = searched;

    // Apply tab filter if specified
    if (tabFilter) {
      switch (tabFilter) {
        case "nudge_provider":
          list = list.filter(isNudgeProvider);
          break;
        case "nudge_family":
          list = list.filter(isNudgeFamily);
          break;
        case "call_no_email":
          list = list.filter(isCallNoEmail);
          break;
        case "hot_leads":
          list = list.filter(isHotLead);
          break;
      }
    } else if (stateFilter) {
      list = list.filter((c) => c.temperature.state === stateFilter);
    } else if (!includeClosed) {
      list = list.filter(
        (c) => c.temperature.state !== "closed" && c.temperature.state !== "live"
      );
    }

    // Sort based on filter type
    if (tabFilter === "hot_leads") {
      // Sort hot leads by heat score (highest first), then by created_at (newest first)
      list.sort((a, b) => {
        if (b.heat_score !== a.heat_score) return b.heat_score - a.heat_score;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      list.sort((a, b) => {
        const pa = INTERVENTION_PRIORITY[a.temperature.state];
        const pb = INTERVENTION_PRIORITY[b.temperature.state];
        if (pa !== pb) return pa - pb;
        return b.temperature.stalenessMs - a.temperature.stalenessMs; // oldest-waiting first
      });
    }

    const total = list.length;
    const page = list.slice(offset, offset + limit);

    // Build engagement map for backward compatibility (legacy format)
    const engagement: Record<string, { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean }> = {};
    for (const c of page) {
      if (c.provider.activityKey) {
        engagement[c.provider.activityKey] = {
          email_clicked: !!c.engagement.email_clicked_at,
          lead_opened: !!c.engagement.lead_opened_at,
          contact_revealed: !!c.engagement.contact_revealed_at,
        };
      }
    }

    // Funnel summary counts
    const funnel = {
      total_leads: searched.length,
      emails_opened: searched.filter((c) => c.engagement.email_opened_at).length,
      leads_viewed: searched.filter((c) => c.engagement.lead_opened_at).length,
      contacts_revealed: searched.filter((c) => c.engagement.contact_revealed_at).length,
      hot_leads: searched.filter((c) => c.is_hot_lead).length,
      connected: searched.filter((c) => c.is_responded).length,
    };

    const truncated = (rows ?? []).length >= FETCH_CAP;
    if (truncated) {
      console.warn(`[connections] fetch hit cap ${FETCH_CAP}; counts/queue may be incomplete`);
    }

    return NextResponse.json({
      connections: page,
      total,
      counts,
      engagement,
      truncated,
      // NEW: Action queue and funnel data
      action_counts: actionCounts,
      funnel,
    });
  } catch (err) {
    console.error("[connections] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
