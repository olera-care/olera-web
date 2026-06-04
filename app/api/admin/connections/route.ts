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

// Label maps for care type and timeline display
const CARE_TYPE_LABELS: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
};

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  asap: "ASAP",
  within_1_month: "Within 1 month",
  within_month: "Within 1 month",
  within_3_months: "Within 3 months",
  few_months: "Within 3 months",
  exploring: "Exploring",
  researching: "Exploring",
};

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

// Simplified tab filters: All | Engaged | No Activity
type TabFilter = "all" | "engaged" | "no_activity";
// Legacy filters (still supported for backwards compatibility)
type ResponseFilter = TabFilter | "needs_attention" | "provider_nudged" | "family_nudged" | "responded" | "no_email";
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
      type ThreadMsg = { from_profile_id: string; text?: string; is_auto_reply?: boolean; created_at?: string; type?: string };
      const thread = (meta.thread as ThreadMsg[]) || [];

      // Find provider's first REAL response (non-auto, non-system, with actual text)
      const providerMsg = thread.find(
        (m) =>
          m.from_profile_id === r.to_profile_id &&
          m.is_auto_reply !== true &&
          m.type !== "system" &&
          m.from_profile_id !== "system" &&
          !!m.text?.trim()
      );
      const responded = !!providerMsg;

      // Check if family has replied AFTER provider's response
      // This determines if we need to nudge the family
      // Only counts REAL replies (non-auto, non-system, with actual text)
      let familyRepliedAfterProvider = false;
      if (responded && providerMsg?.created_at) {
        const providerResponseTime = new Date(providerMsg.created_at).getTime();
        familyRepliedAfterProvider = thread.some(
          (m) =>
            m.from_profile_id === r.from_profile_id &&
            m.is_auto_reply !== true &&
            m.type !== "system" &&
            m.from_profile_id !== "system" &&
            !!m.text?.trim() &&
            m.created_at &&
            new Date(m.created_at).getTime() > providerResponseTime
        );
      }

      // Extract message preview and care metadata
      let messagePreview = "";
      let careType: string | null = null;
      let timeline: string | null = null;

      if (r.message) {
        try {
          const msgJson = JSON.parse(String(r.message));
          messagePreview = msgJson.additional_notes || msgJson.message || msgJson.notes || "";
          // Extract care type and timeline for collapsed row display
          if (msgJson.care_type) {
            careType = CARE_TYPE_LABELS[msgJson.care_type] || msgJson.care_type;
          }
          if (msgJson.urgency) {
            timeline = TIMELINE_LABELS[msgJson.urgency] || msgJson.urgency;
          }
        } catch {
          messagePreview = String(r.message);
        }
      }
      // Fallback to family profile care_types
      if (!careType && family?.care_types?.length) {
        careType = CARE_TYPE_LABELS[family.care_types[0]] || family.care_types[0];
      }
      // Fallback to family metadata timeline
      if (!timeline && family?.metadata) {
        const familyMeta = family.metadata as Record<string, unknown>;
        if (familyMeta.timeline) {
          timeline = TIMELINE_LABELS[familyMeta.timeline as string] || (familyMeta.timeline as string);
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
      // Logic: First check provider state, then if provider responded check family state
      const hasProviderEmail = !!provider?.email;
      const providerIsActive = provider?.is_active !== false;
      const providerNudgedRecently = providerNudgedAt
        ? now - new Date(providerNudgedAt).getTime() < SEVEN_DAYS_MS
        : false;
      const familyNudgedRecently = familyNudgedAt
        ? now - new Date(familyNudgedAt).getTime() < SEVEN_DAYS_MS
        : false;

      let responseCategory: ResponseCategory | null;
      if (!providerIsActive) {
        responseCategory = null; // Inactive providers excluded from all counts
      } else if (!hasProviderEmail) {
        responseCategory = "no_email"; // Can't email, must call
      } else if (responded) {
        // Provider responded - now check family state
        if (familyRepliedAfterProvider) {
          responseCategory = "responded"; // Both parties engaged - truly connected
        } else if (familyNudgedRecently) {
          responseCategory = "family_nudged"; // Waiting on family to reply
        } else {
          responseCategory = "responded"; // Provider responded, ready for family nudge
        }
      } else {
        // Provider hasn't responded yet
        if (providerNudgedRecently) {
          responseCategory = "provider_nudged"; // Waiting on provider
        } else {
          responseCategory = "needs_attention"; // Ready to nudge provider
        }
      }

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
          careType,
          timeline,
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

    // Engagement-based counts (per-provider for now - legacy events don't have per-connection IDs)
    // Engaged = provider opened ANY lead OR copied ANY contact
    // No Activity = provider has no engagement events

    // Build provider keys for engagement lookup
    const allProviderKeys = [...new Set(
      searched.map((c) => c.provider.activityKey).filter(Boolean) as string[]
    )].slice(0, 1000);

    // Per-provider engagement tracking
    // Engaged = opened lead OR copied contact OR clicked continue in inbox
    const providerEngagement = new Map<string, {
      email_clicked: boolean;
      lead_opened: boolean;
      contact_revealed: boolean;
      continue_in_inbox: boolean;
    }>();

    // Initialize all providers as not engaged
    for (const key of allProviderKeys) {
      providerEngagement.set(key, {
        email_clicked: false,
        lead_opened: false,
        contact_revealed: false,
        continue_in_inbox: false,
      });
    }

    // Fetch engagement events by provider
    if (allProviderKeys.length > 0) {
      const { data: actEvents } = await db
        .from("provider_activity")
        .select("provider_id, event_type")
        .in("provider_id", allProviderKeys)
        .in("event_type", ["email_click", "lead_opened", "contact_revealed", "continue_in_inbox"])
        .limit(10000);

      for (const ev of actEvents ?? []) {
        const eng = providerEngagement.get(ev.provider_id);
        if (!eng) continue;

        if (ev.event_type === "email_click") eng.email_clicked = true;
        else if (ev.event_type === "lead_opened") eng.lead_opened = true;
        else if (ev.event_type === "contact_revealed") eng.contact_revealed = true;
        else if (ev.event_type === "continue_in_inbox") eng.continue_in_inbox = true;
      }
    }

    // Count engaged vs no_activity
    let engagedCount = 0;
    let noActivityCount = 0;
    const connectionEngaged = new Map<string, boolean>();

    for (const c of searched) {
      const eng = c.provider.activityKey ? providerEngagement.get(c.provider.activityKey) : null;
      // Engaged = opened lead drawer OR copied contact OR clicked continue in inbox
      // email_click alone doesn't count - they might have bounced before seeing the lead
      const isEngaged = !!(eng?.lead_opened || eng?.contact_revealed || eng?.continue_in_inbox);
      connectionEngaged.set(c.id, isEngaged);

      if (isEngaged) {
        engagedCount++;
      } else {
        noActivityCount++;
      }
    }

    // Filtering: all, engaged, no_activity
    let list = searched;

    if (responseFilter === "engaged") {
      list = list.filter((c) => connectionEngaged.get(c.id) === true);
    } else if (responseFilter === "no_activity") {
      list = list.filter((c) => connectionEngaged.get(c.id) === false);
    }
    // "all" or no filter shows everything

    // Sort by most recent first (matches Leads page behavior)
    list.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    const page = list.slice(offset, offset + limit);

    // Per-provider engagement data for UI badges (keyed by provider activityKey)
    const engagement: Record<string, { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean; continue_in_inbox: boolean }> = {};
    for (const c of page) {
      const key = c.provider.activityKey;
      if (key && !engagement[key]) {
        const eng = providerEngagement.get(key);
        engagement[key] = {
          email_clicked: eng?.email_clicked ?? false,
          lead_opened: eng?.lead_opened ?? false,
          contact_revealed: eng?.contact_revealed ?? false,
          continue_in_inbox: eng?.continue_in_inbox ?? false,
        };
      }
    }

    const truncated = (rows ?? []).length >= FETCH_CAP;
    if (truncated) {
      console.warn(`[connections] fetch hit cap ${FETCH_CAP}; counts/queue may be incomplete`);
    }

    return NextResponse.json({
      connections: page,
      total: list.length,  // Count after tab filter, for correct pagination
      engagedCount,
      noActivityCount,
      engagement,
      truncated,
    });
  } catch (err) {
    console.error("[connections] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
