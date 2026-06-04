import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { isSuccessfulConnection } from "@/lib/connection-temperature";

/**
 * GET /api/admin/connections/hot-leads — monetization goldmine.
 *
 * Hot Leads are providers who have shown strong engagement signals
 * (clicked email, viewed lead, copied contact info, claimed account)
 * BUT have NOT responded to the family yet.
 *
 * These are prime monetization targets — highly engaged but haven't converted.
 *
 * Heat Score Calculation:
 *   - phone_clicked: +45 (called family directly — strongest)
 *   - email_link_clicked: +45 (emailed family directly — strongest)
 *   - contact_revealed: +40 (copied family's phone/email)
 *   - account_claimed: +30
 *   - one_click_access: +25
 *   - lead_opened: +20
 *   - email_clicked: +10
 *   - Recent (< 3 days): 2x multiplier
 *   - Going cold (> 7 days): 0.5x multiplier
 */

const HEAT_WEIGHTS = {
  phone_clicked: 45,       // Called family directly - strongest intent
  email_link_clicked: 45,  // Emailed family directly - strongest intent
  contact_revealed: 40,    // Copied contact info
  claim_completed: 30,
  one_click_access: 25,
  lead_opened: 20,
  email_click: 10,
} as const;

const HOT_LEAD_THRESHOLD = 50;
const RECENT_DAYS = 3;
const COLD_DAYS = 7;

interface HotLead {
  connection_id: string;
  provider: {
    id: string | null;
    name: string | null;
    slug: string | null;
    email: string | null;
  };
  family: {
    id: string | null;
    name: string | null;
  };
  engagement: {
    email_clicked: boolean;
    email_clicked_at: string | null;
    lead_opened: boolean;
    lead_opened_at: string | null;
    contact_revealed: boolean;
    contact_revealed_at: string | null;
    phone_clicked: boolean;
    phone_clicked_at: string | null;
    email_link_clicked: boolean;
    email_link_clicked_at: string | null;
    account_claimed: boolean;
    claimed_at: string | null;
    one_click_access: boolean;
    one_click_at: string | null;
  };
  days_since_last_engagement: number;
  days_since_lead_sent: number;
  heat_score: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const db = getServiceClient();
    const now = Date.now();

    // 1. Get non-successful inquiry connections (provider hasn't responded)
    let connectionsQuery = db
      .from("connections")
      .select(`
        id, status, metadata, created_at, from_profile_id, to_profile_id,
        from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, email, phone),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email, claim_state)
      `)
      .eq("type", "inquiry")
      .not("metadata", "cs", JSON.stringify({ archived: true }))
      .order("created_at", { ascending: false })
      .limit(3000);

    if (dateFrom) connectionsQuery = connectionsQuery.gte("created_at", dateFrom);
    if (dateTo) connectionsQuery = connectionsQuery.lte("created_at", dateTo);

    const { data: connections, error: connError } = await connectionsQuery;
    if (connError) {
      console.error("[connections/hot-leads] connections query error:", connError);
      return NextResponse.json({ error: "Failed to load connections" }, { status: 500 });
    }

    // Filter to only non-successful connections (provider hasn't responded)
    const nonSuccessful = (connections ?? []).filter((c) => !isSuccessfulConnection(c));

    // Build provider keys for activity lookup
    const providerKeys: string[] = [];
    const keyToConnection = new Map<string, (typeof nonSuccessful)[0][]>();

    for (const c of nonSuccessful) {
      const provider = Array.isArray(c.to_profile) ? c.to_profile[0] : c.to_profile;
      const key = provider?.slug || provider?.source_provider_id || c.to_profile_id;
      if (key) {
        providerKeys.push(key);
        if (!keyToConnection.has(key)) keyToConnection.set(key, []);
        keyToConnection.get(key)!.push(c);
      }
    }

    if (providerKeys.length === 0) {
      return NextResponse.json({ hot_leads: [], total: 0 });
    }

    // 2. Get provider_activity for engagement events
    // Note: This fetches activity at the provider level, not connection level.
    // If a provider has multiple leads, engagement from any lead contributes to their score.
    const { data: activities } = await db
      .from("provider_activity")
      .select("provider_id, event_type, created_at")
      .in("provider_id", [...new Set(providerKeys)])
      .in("event_type", ["email_click", "lead_opened", "contact_revealed", "phone_clicked", "email_link_clicked", "one_click_access", "claim_completed"])
      .order("created_at", { ascending: false })
      .limit(10000);

    // Build engagement map by provider
    const engagementByProvider = new Map<string, {
      email_clicked_at: string | null;
      lead_opened_at: string | null;
      contact_revealed_at: string | null;
      phone_clicked_at: string | null;
      email_link_clicked_at: string | null;
      one_click_at: string | null;
      claimed_at: string | null;
    }>();

    for (const a of activities ?? []) {
      if (!engagementByProvider.has(a.provider_id)) {
        engagementByProvider.set(a.provider_id, {
          email_clicked_at: null,
          lead_opened_at: null,
          contact_revealed_at: null,
          phone_clicked_at: null,
          email_link_clicked_at: null,
          one_click_at: null,
          claimed_at: null,
        });
      }
      const eng = engagementByProvider.get(a.provider_id)!;

      // Keep earliest timestamp for each event type
      const updateIfEarlier = (field: keyof typeof eng, timestamp: string) => {
        if (!eng[field] || new Date(timestamp) < new Date(eng[field]!)) {
          eng[field] = timestamp;
        }
      };

      if (a.event_type === "email_click") updateIfEarlier("email_clicked_at", a.created_at);
      if (a.event_type === "lead_opened") updateIfEarlier("lead_opened_at", a.created_at);
      if (a.event_type === "contact_revealed") updateIfEarlier("contact_revealed_at", a.created_at);
      if (a.event_type === "phone_clicked") updateIfEarlier("phone_clicked_at", a.created_at);
      if (a.event_type === "email_link_clicked") updateIfEarlier("email_link_clicked_at", a.created_at);
      if (a.event_type === "one_click_access") updateIfEarlier("one_click_at", a.created_at);
      if (a.event_type === "claim_completed") updateIfEarlier("claimed_at", a.created_at);
    }

    // 3. Build hot leads with heat scores
    const hotLeads: HotLead[] = [];

    for (const c of nonSuccessful) {
      const provider = Array.isArray(c.to_profile) ? c.to_profile[0] : c.to_profile;
      const family = Array.isArray(c.from_profile) ? c.from_profile[0] : c.from_profile;
      const key = provider?.slug || provider?.source_provider_id || c.to_profile_id;

      if (!key) continue;

      const eng = engagementByProvider.get(key);
      if (!eng) continue; // No engagement at all

      // Check if there's any engagement
      const hasAnyEngagement =
        eng.email_clicked_at ||
        eng.lead_opened_at ||
        eng.contact_revealed_at ||
        eng.phone_clicked_at ||
        eng.email_link_clicked_at ||
        eng.one_click_at ||
        eng.claimed_at;

      if (!hasAnyEngagement) continue;

      // Calculate base heat score
      let baseScore = 0;
      if (eng.phone_clicked_at) baseScore += HEAT_WEIGHTS.phone_clicked;
      if (eng.email_link_clicked_at) baseScore += HEAT_WEIGHTS.email_link_clicked;
      if (eng.contact_revealed_at) baseScore += HEAT_WEIGHTS.contact_revealed;
      if (eng.claimed_at) baseScore += HEAT_WEIGHTS.claim_completed;
      if (eng.one_click_at) baseScore += HEAT_WEIGHTS.one_click_access;
      if (eng.lead_opened_at) baseScore += HEAT_WEIGHTS.lead_opened;
      if (eng.email_clicked_at) baseScore += HEAT_WEIGHTS.email_click;

      // Find most recent engagement timestamp
      const timestamps = [
        eng.email_clicked_at,
        eng.lead_opened_at,
        eng.contact_revealed_at,
        eng.phone_clicked_at,
        eng.email_link_clicked_at,
        eng.one_click_at,
        eng.claimed_at,
      ].filter(Boolean) as string[];

      const lastEngagement = timestamps.length > 0
        ? Math.max(...timestamps.map((t) => new Date(t).getTime()))
        : new Date(c.created_at).getTime();

      const daysSinceEngagement = Math.floor((now - lastEngagement) / (1000 * 60 * 60 * 24));
      const daysSinceCreated = Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));

      // Apply time multiplier
      let multiplier = 1;
      if (daysSinceEngagement < RECENT_DAYS) multiplier = 2;
      else if (daysSinceEngagement > COLD_DAYS) multiplier = 0.5;

      const heatScore = Math.round(baseScore * multiplier);

      // Skip if below threshold
      if (heatScore < HOT_LEAD_THRESHOLD) continue;

      hotLeads.push({
        connection_id: c.id,
        provider: {
          id: provider?.id ?? null,
          name: provider?.display_name ?? null,
          slug: provider?.slug ?? null,
          email: provider?.email ?? null,
        },
        family: {
          id: family?.id ?? null,
          name: family?.display_name ?? null,
        },
        engagement: {
          email_clicked: !!eng.email_clicked_at,
          email_clicked_at: eng.email_clicked_at,
          lead_opened: !!eng.lead_opened_at,
          lead_opened_at: eng.lead_opened_at,
          contact_revealed: !!eng.contact_revealed_at,
          contact_revealed_at: eng.contact_revealed_at,
          phone_clicked: !!eng.phone_clicked_at,
          phone_clicked_at: eng.phone_clicked_at,
          email_link_clicked: !!eng.email_link_clicked_at,
          email_link_clicked_at: eng.email_link_clicked_at,
          account_claimed: !!eng.claimed_at,
          claimed_at: eng.claimed_at,
          one_click_access: !!eng.one_click_at,
          one_click_at: eng.one_click_at,
        },
        days_since_last_engagement: daysSinceEngagement,
        days_since_lead_sent: daysSinceCreated,
        heat_score: heatScore,
        created_at: c.created_at,
      });
    }

    // Sort by heat score descending, then by created_at descending
    hotLeads.sort((a, b) => {
      if (b.heat_score !== a.heat_score) return b.heat_score - a.heat_score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      hot_leads: hotLeads.slice(0, limit),
      total: hotLeads.length,
    });
  } catch (err) {
    console.error("[connections/hot-leads] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
