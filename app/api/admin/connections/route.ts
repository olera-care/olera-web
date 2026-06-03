import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  getConnectionTemperature,
  INTERVENTION_PRIORITY,
  type ConnectionTemperatureState,
} from "@/lib/connection-temperature";
import {
  calculateFamilyCompleteness,
  calculateProviderCompleteness,
} from "@/lib/admin/profile-completeness";

/**
 * GET /api/admin/connections — rows for the connections tracker's
 * intervention queue, each tagged with its temperature (whose-turn + staleness)
 * and sorted most-needs-attention first.
 *
 * Query params:
 *   - filter         "all" | "needs_attention" | "provider_nudged" | "family_nudged" | "responded" | "no_email"
 *   - state          (legacy) one of awaiting_provider|awaiting_family|live|going_cold|closed
 *   - include_closed "true" to include declined/expired/ended connections (default: excluded)
 *   - search         case-insensitive match on family or provider display name
 *   - date_from/to   filter by connection created_at
 *   - limit/offset   pagination (default 50 / 0)
 *
 * Temperature is computed in-memory (the thread lives in metadata JSONB, so it
 * can't be a SQL filter) over a capped active set, exactly like the needs-email
 * path in /api/admin/leads. Returns `counts` over the full set (pre-pagination,
 * pre-state-filter) so the UI can label its sections.
 *
 * v2: Added response-based filtering (filter param) and profile completeness.
 */
const FETCH_CAP = 3000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type FamilyProfile = {
  id?: string;
  display_name?: string | null;
  type?: string | null;
  email?: string | null;
  phone?: string | null;
  image_url?: string | null;
  city?: string | null;
  description?: string | null;
  care_types?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

type ProviderProfile = {
  id?: string;
  display_name?: string | null;
  slug?: string | null;
  source_provider_id?: string | null;
  email?: string | null;
  phone?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  description?: string | null;
  care_types?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

type ProfileJoin<T> = T[] | T | null;

function one<T>(p: ProfileJoin<T>): T | undefined {
  return Array.isArray(p) ? p[0] : p ?? undefined;
}

// Simplified tab filters (new)
type TabFilter = "todo" | "waiting" | "connected";
// Action queue filters
type ActionFilter = "hot_leads" | "nudge_provider" | "nudge_family" | "call_no_email";
// Legacy granular filters (still supported for backwards compatibility)
type ResponseFilter = TabFilter | ActionFilter | "all" | "needs_attention" | "provider_nudged" | "family_nudged" | "responded" | "no_email";
type ResponseCategory = "needs_attention" | "provider_nudged" | "family_nudged" | "responded" | "no_email";

interface ResponseCounts {
  all: number;
  needs_attention: number;
  provider_nudged: number;
  family_nudged: number;
  responded: number;
  no_email: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const responseFilter = (searchParams.get("filter") || "all") as ResponseFilter;
    const stateFilter = searchParams.get("state") as ConnectionTemperatureState | null;
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
        from_profile:business_profiles!connections_from_profile_id_fkey(
          id, display_name, type, email, phone, image_url, city, description, care_types, metadata
        ),
        to_profile:business_profiles!connections_to_profile_id_fkey(
          id, display_name, slug, source_provider_id, email, phone, image_url, is_active,
          website, address, city, state, description, care_types, metadata
        )
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
    const all = (rows ?? []).map((r) => {
      const family = one(r.from_profile as ProfileJoin<FamilyProfile>);
      const provider = one(r.to_profile as ProfileJoin<ProviderProfile>);
      const meta = (r.metadata as Record<string, unknown>) ?? {};

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

      // Calculate profile completeness
      const familyCompleteness = family
        ? calculateFamilyCompleteness(family, family.email)
        : { percentage: 0, missingFields: [] };
      const providerCompleteness = provider
        ? calculateProviderCompleteness(provider)
        : { percentage: 0, missingFields: [] };

      // Extract nudge info from metadata
      const providerNudgedAt = (meta.nudged_at as string) || null;
      const familyNudgedAt = (meta.family_nudged_at as string) || null;
      const nudgeCount = (meta.nudge_count as number) || 0;

      // Check for provider response and conversation state
      type ThreadMsg = { from_profile_id: string; text?: string; is_auto_reply?: boolean; created_at?: string };
      const thread = (meta.thread as ThreadMsg[]) || [];

      // Find provider's first non-auto-reply response
      const providerMsg = thread.find(
        (m) => m.from_profile_id === r.to_profile_id && m.is_auto_reply !== true
      );
      const responded = !!providerMsg;

      // Check if family has replied AFTER provider's response
      // This determines if we need to nudge the family
      let familyRepliedAfterProvider = false;
      if (responded && providerMsg?.created_at) {
        const providerResponseTime = new Date(providerMsg.created_at).getTime();
        familyRepliedAfterProvider = thread.some(
          (m) =>
            m.from_profile_id === r.from_profile_id &&
            m.is_auto_reply !== true &&
            m.created_at &&
            new Date(m.created_at).getTime() > providerResponseTime
        );
      }

      // Extract message preview
      let messagePreview = "";
      if (r.message) {
        try {
          const msgJson = JSON.parse(String(r.message));
          messagePreview = msgJson.additional_notes || msgJson.message || msgJson.notes || "";
        } catch {
          messagePreview = String(r.message);
        }
      }
      if (!messagePreview && thread.length > 0) {
        const familyMsg = thread.find(
          (m) => m.from_profile_id === r.from_profile_id && m.text && !m.is_auto_reply
        );
        if (familyMsg?.text) messagePreview = familyMsg.text;
      }
      if (messagePreview.length > 80) {
        messagePreview = messagePreview.substring(0, 77) + "...";
      }

      // Determine response-based category
      // Priority order (first match wins):
      //   1. responded - provider replied (terminal state)
      //   2. inactive - provider marked inactive (excluded from counts)
      //   3. no_email - can't nudge without email
      //   4. provider_nudged - waiting on provider (takes priority over family)
      //   5. family_nudged - waiting on family
      //   6. needs_attention - ready for action
      const hasProviderEmail = !!provider?.email;
      const providerIsActive = provider?.is_active !== false;
      const providerNudgedRecently = providerNudgedAt
        ? now - new Date(providerNudgedAt).getTime() < SEVEN_DAYS_MS
        : false;
      const familyNudgedRecently = familyNudgedAt
        ? now - new Date(familyNudgedAt).getTime() < SEVEN_DAYS_MS
        : false;

      let responseCategory: ResponseCategory | null;
      if (responded) responseCategory = "responded";
      else if (!providerIsActive) responseCategory = null;
      else if (!hasProviderEmail) responseCategory = "no_email";
      else if (providerNudgedRecently) responseCategory = "provider_nudged";
      else if (familyNudgedRecently) responseCategory = "family_nudged";
      else responseCategory = "needs_attention";

      return {
        id: r.id,
        type: r.type,
        status: r.status,
        created_at: r.created_at,
        family: {
          id: family?.id ?? null,
          display_name: family?.display_name ?? null,
          email: family?.email ?? null,
          phone: family?.phone ?? null,
          image_url: family?.image_url ?? null,
          completeness: familyCompleteness,
        },
        provider: {
          id: provider?.id ?? null,
          display_name: provider?.display_name ?? null,
          slug: provider?.slug ?? null,
          source_provider_id: provider?.source_provider_id ?? null,
          email: provider?.email ?? null,
          phone: provider?.phone ?? null,
          image_url: provider?.image_url ?? null,
          is_active: providerIsActive,
          completeness: providerCompleteness,
          activityKey: provider?.slug || provider?.source_provider_id || provider?.id || null,
        },
        messagePreview,
        responded,
        familyRepliedAfterProvider,
        nudgeCount,
        providerNudgedAt,
        familyNudgedAt,
        responseCategory,
        temperature,
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

    // Temperature-based counts (legacy)
    const counts: Record<ConnectionTemperatureState, number> = {
      awaiting_provider: 0,
      awaiting_family: 0,
      live: 0,
      going_cold: 0,
      closed: 0,
    };
    for (const c of searched) counts[c.temperature.state]++;

    // Response-based counts (new)
    // Note: `all` only counts active providers (those with a responseCategory)
    // Inactive providers are excluded from all counts for consistency
    const responseCounts: ResponseCounts = {
      all: 0,
      needs_attention: 0,
      provider_nudged: 0,
      family_nudged: 0,
      responded: 0,
      no_email: 0,
    };
    for (const c of searched) {
      if (c.responseCategory) {
        responseCounts.all++;
        responseCounts[c.responseCategory]++;
      }
    }

    // Calculate action counts for the Action Queue
    // Requires engagement data to identify hot leads
    const HEAT_WEIGHTS = {
      contact_revealed: 40,
      claim_completed: 30,
      one_click_access: 25,
      lead_opened: 20,
      email_click: 10,
    } as const;
    const HOT_LEAD_THRESHOLD = 50;
    const RECENT_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const COLD_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // Fetch engagement data for hot lead detection (limited to searched set)
    const allProviderKeys = [...new Set(
      searched.map((c) => c.provider.activityKey).filter(Boolean) as string[]
    )].slice(0, 1000); // Cap to prevent huge queries

    const actionEngagement = new Map<string, {
      email_clicked: boolean;
      lead_opened: boolean;
      contact_revealed: boolean;
      one_click_access: boolean;
      claim_completed: boolean;
      last_engagement_at: number;
    }>();

    if (allProviderKeys.length > 0) {
      const { data: actEvents } = await db
        .from("provider_activity")
        .select("provider_id, event_type, created_at")
        .in("provider_id", allProviderKeys)
        .in("event_type", ["email_click", "lead_opened", "contact_revealed", "one_click_access", "claim_completed"])
        .limit(10000);

      for (const key of allProviderKeys) {
        actionEngagement.set(key, {
          email_clicked: false,
          lead_opened: false,
          contact_revealed: false,
          one_click_access: false,
          claim_completed: false,
          last_engagement_at: 0,
        });
      }

      for (const ev of actEvents ?? []) {
        const eng = actionEngagement.get(ev.provider_id);
        if (!eng) continue;
        const evTime = new Date(ev.created_at).getTime();
        if (evTime > eng.last_engagement_at) eng.last_engagement_at = evTime;

        if (ev.event_type === "email_click") eng.email_clicked = true;
        else if (ev.event_type === "lead_opened") eng.lead_opened = true;
        else if (ev.event_type === "contact_revealed") eng.contact_revealed = true;
        else if (ev.event_type === "one_click_access") eng.one_click_access = true;
        else if (ev.event_type === "claim_completed") eng.claim_completed = true;
      }
    }

    // Calculate heat scores and action counts
    // Also build a map of connection -> action category for filtering
    const action_counts = {
      nudge_provider: 0,
      nudge_family: 0,
      call_no_email: 0,
      hot_leads: 0,
    };

    // Track which action category each connection belongs to
    const connectionActionCategory = new Map<string, keyof typeof action_counts>();

    for (const c of searched) {
      if (!c.responseCategory) continue; // Skip inactive providers

      // Calculate heat score for this connection
      const eng = c.provider.activityKey ? actionEngagement.get(c.provider.activityKey) : null;
      let baseScore = 0;
      if (eng) {
        if (eng.contact_revealed) baseScore += HEAT_WEIGHTS.contact_revealed;
        if (eng.claim_completed) baseScore += HEAT_WEIGHTS.claim_completed;
        if (eng.one_click_access) baseScore += HEAT_WEIGHTS.one_click_access;
        if (eng.lead_opened) baseScore += HEAT_WEIGHTS.lead_opened;
        if (eng.email_clicked) baseScore += HEAT_WEIGHTS.email_click;
      }

      // Apply time multiplier
      let multiplier = 1;
      if (eng && eng.last_engagement_at > 0) {
        const daysSinceEngagement = now - eng.last_engagement_at;
        if (daysSinceEngagement < RECENT_DAYS_MS) multiplier = 2;
        else if (daysSinceEngagement > COLD_DAYS_MS) multiplier = 0.5;
      }
      const heatScore = Math.round(baseScore * multiplier);

      // Hot leads: high engagement BUT only from needs_attention category
      // Don't count provider_nudged/family_nudged as hot - we've already taken action
      const isHotLead =
        heatScore >= HOT_LEAD_THRESHOLD &&
        c.responseCategory === "needs_attention";

      // Categorize for action queue
      // Each connection belongs to exactly ONE action category
      if (c.responseCategory === "no_email") {
        action_counts.call_no_email++;
        connectionActionCategory.set(c.id, "call_no_email");
      } else if (isHotLead) {
        action_counts.hot_leads++;
        connectionActionCategory.set(c.id, "hot_leads");
      } else if (c.responseCategory === "needs_attention") {
        action_counts.nudge_provider++;
        connectionActionCategory.set(c.id, "nudge_provider");
      } else if (c.responseCategory === "responded") {
        // Provider responded - only count as nudge_family if:
        // 1. Family has NOT replied after provider's response
        // 2. Family was NOT nudged recently
        const familyNudgedRecently = c.familyNudgedAt
          ? now - new Date(c.familyNudgedAt).getTime() < SEVEN_DAYS_MS
          : false;

        if (!c.familyRepliedAfterProvider && !familyNudgedRecently) {
          action_counts.nudge_family++;
          connectionActionCategory.set(c.id, "nudge_family");
        }
        // else: family already replied or was nudged - no action needed
      }
      // Note: provider_nudged and family_nudged are "waiting" states - no action needed
    }

    // Filtering:
    //   - Action queue filters: "hot_leads", "nudge_provider", "nudge_family", "call_no_email"
    //   - Simplified tabs: "todo", "waiting", "connected"
    //   - Legacy granular: "needs_attention", "provider_nudged", etc.
    //   - Else if explicit `state` param, use temperature-based filter
    //   - Else if include_closed, show everything
    //   - Else default queue
    const actionFilters: ActionFilter[] = ["hot_leads", "nudge_provider", "nudge_family", "call_no_email"];
    let list = searched;

    if (actionFilters.includes(responseFilter as ActionFilter)) {
      // Filter by action queue category
      list = list.filter((c) => connectionActionCategory.get(c.id) === responseFilter);
    } else if (responseFilter === "todo") {
      // To Do = needs_attention + no_email
      list = list.filter((c) => c.responseCategory === "needs_attention" || c.responseCategory === "no_email");
    } else if (responseFilter === "waiting") {
      // Waiting = provider_nudged + family_nudged
      list = list.filter((c) => c.responseCategory === "provider_nudged" || c.responseCategory === "family_nudged");
    } else if (responseFilter === "connected") {
      // Connected = responded
      list = list.filter((c) => c.responseCategory === "responded");
    } else if (responseFilter && responseFilter !== "all") {
      // Legacy granular filter
      list = list.filter((c) => c.responseCategory === responseFilter);
    } else if (stateFilter) {
      list = list.filter((c) => c.temperature.state === stateFilter);
    } else if (!includeClosed) {
      list = list.filter(
        (c) => c.temperature.state !== "closed" && c.temperature.state !== "live"
      );
    }

    list.sort((a, b) => {
      const pa = INTERVENTION_PRIORITY[a.temperature.state];
      const pb = INTERVENTION_PRIORITY[b.temperature.state];
      if (pa !== pb) return pa - pb;
      return b.temperature.stalenessMs - a.temperature.stalenessMs; // oldest-waiting first
    });

    const total = list.length;
    const page = list.slice(offset, offset + limit);

    // Provider engagement (opened/clicked/contact revealed) — reuse data from
    // actionEngagement map instead of making a second query
    const engagement: Record<string, { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean }> = {};
    for (const c of page) {
      const key = c.provider.activityKey;
      if (key) {
        const eng = actionEngagement.get(key);
        engagement[key] = {
          email_clicked: eng?.email_clicked ?? false,
          lead_opened: eng?.lead_opened ?? false,
          contact_revealed: eng?.contact_revealed ?? false,
        };
      }
    }

    const truncated = (rows ?? []).length >= FETCH_CAP;
    if (truncated) {
      console.warn(`[connections] fetch hit cap ${FETCH_CAP}; counts/queue may be incomplete`);
    }

    return NextResponse.json({
      connections: page,
      total,
      counts,
      responseCounts,
      engagement,
      truncated,
      action_counts,
    });
  } catch (err) {
    console.error("[connections] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
