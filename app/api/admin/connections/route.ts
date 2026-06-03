import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  getConnectionTemperature,
  INTERVENTION_PRIORITY,
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
 *
 * Temperature is computed in-memory (the thread lives in metadata JSONB, so it
 * can't be a SQL filter) over a capped active set, exactly like the needs-email
 * path in /api/admin/leads. Returns `counts` over the full set (pre-pagination,
 * pre-state-filter) so the UI can label its sections.
 */
const FETCH_CAP = 3000;

type ProfileJoin =
  | { id?: string; display_name?: string | null; slug?: string | null; source_provider_id?: string | null; email?: string | null; type?: string | null }[]
  | { id?: string; display_name?: string | null; slug?: string | null; source_provider_id?: string | null; email?: string | null; type?: string | null }
  | null;

function one(p: ProfileJoin) {
  return Array.isArray(p) ? p[0] : p;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
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
        from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, type),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email, is_active)
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
      const family = one(r.from_profile as ProfileJoin);
      const provider = one(r.to_profile as ProfileJoin);
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
      return {
        id: r.id,
        type: r.type,
        status: r.status,
        created_at: r.created_at,
        family: { id: family?.id, display_name: family?.display_name ?? null },
        provider: {
          id: provider?.id,
          display_name: provider?.display_name ?? null,
          slug: provider?.slug ?? null,
          source_provider_id: provider?.source_provider_id ?? null,
          email: provider?.email ?? null,
          // The key provider_activity is keyed on (slug → source_provider_id → id).
          activityKey: provider?.slug || provider?.source_provider_id || provider?.id || null,
        },
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

    // Counts across the searched set (every state), for section labels.
    const counts: Record<ConnectionTemperatureState, number> = {
      awaiting_provider: 0,
      awaiting_family: 0,
      live: 0,
      going_cold: 0,
      closed: 0,
    };
    for (const c of searched) counts[c.temperature.state]++;

    // Returned list:
    //   - explicit `state`     → exactly that state (e.g. the Live / Closed tabs)
    //   - `include_closed`     → everything
    //   - default ("queue")    → only states that need attention: going_cold +
    //                            awaiting_provider + awaiting_family. `live` and
    //                            `closed` are excluded so the intervention queue
    //                            never mixes in healthy/finished connections.
    let list = searched;
    if (stateFilter) {
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

    // Provider engagement (opened/clicked/contact revealed), batched — same
    // shape as /api/admin/leads. Non-blocking: supplementary signal.
    const engagement: Record<string, { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean }> = {};
    try {
      const keys = [...new Set(page.map((c) => c.provider.activityKey).filter(Boolean) as string[])];
      if (keys.length > 0) {
        const { data: events } = await db
          .from("provider_activity")
          .select("provider_id, event_type")
          .in("provider_id", keys)
          .in("event_type", ["email_click", "lead_opened", "contact_revealed"]);
        for (const key of keys) {
          const ev = (events ?? []).filter((e) => e.provider_id === key);
          engagement[key] = {
            email_clicked: ev.some((e) => e.event_type === "email_click"),
            lead_opened: ev.some((e) => e.event_type === "lead_opened"),
            contact_revealed: ev.some((e) => e.event_type === "contact_revealed"),
          };
        }
      }
    } catch {
      // Non-blocking — engagement is supplementary.
    }

    const truncated = (rows ?? []).length >= FETCH_CAP;
    if (truncated) {
      console.warn(`[connections] fetch hit cap ${FETCH_CAP}; counts/queue may be incomplete`);
    }

    return NextResponse.json({ connections: page, total, counts, engagement, truncated });
  } catch (err) {
    console.error("[connections] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
