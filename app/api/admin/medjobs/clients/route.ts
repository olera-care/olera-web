import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  getClientStatus,
  type ClientStatus,
  type ProviderMetadata,
} from "@/lib/medjobs/clients";

/**
 * GET /api/admin/medjobs/clients
 *
 * Returns the provider rows that meet the v9.0 "Client" criteria:
 *   - in 90-day pilot (interview_terms_accepted_at within last 90 days), OR
 *   - active Stripe subscription (medjobs_subscription_active = true)
 *
 * Pilot-expired providers (T&C accepted >90d ago, never subscribed) are
 * surfaced separately so admin can decide whether to retain or remove
 * them. The endpoint returns them with status='pilot_expired' and the
 * client UI defaults to filtering them out.
 *
 * Query params:
 *   include_expired=true  → include pilot_expired rows in response
 *   search=<string>       → filter by display_name
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get("include_expired") === "true";
    const search = searchParams.get("search")?.trim() || "";

    const db = getServiceClient();

    // Provider profiles: organization (agency) or caregiver. Filter by
    // metadata fields server-side using the JSONB ?-operator-equivalent.
    // We can't easily do "interview_terms_accepted_at IS NOT NULL" via
    // PostgREST, so pull a minimal column set and filter in JS. Provider
    // counts are small (hundreds) — perf is fine for v9.0.
    let query = db
      .from("business_profiles")
      .select(
        "id, display_name, slug, email, phone, city, state, metadata, is_active, image_url, created_at, updated_at",
      )
      .in("type", ["organization", "caregiver"])
      .order("created_at", { ascending: false });

    if (search) {
      const safe = search.replace(/[%_]/g, (m) => `\\${m}`);
      query = query.ilike("display_name", `%${safe}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[admin/medjobs/clients] query error:", error);
      return NextResponse.json(
        { error: `Failed to fetch clients: ${error.message}` },
        { status: 500 },
      );
    }

    type ProviderRow = {
      id: string;
      display_name: string | null;
      slug: string | null;
      email: string | null;
      phone: string | null;
      city: string | null;
      state: string | null;
      metadata: ProviderMetadata | null;
      is_active: boolean;
      image_url: string | null;
      created_at: string;
      updated_at: string;
    };

    const rows = ((data ?? []) as ProviderRow[])
      .map((row) => {
        const status = getClientStatus(row.metadata);
        return {
          id: row.id,
          display_name: row.display_name || "(unnamed provider)",
          slug: row.slug,
          email: row.email,
          phone: row.phone,
          city: row.city,
          state: row.state,
          image_url: row.image_url,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          stripe_customer_id: row.metadata?.medjobs_stripe_customer_id ?? null,
          subscription_id: row.metadata?.medjobs_subscription_id ?? null,
          subscription_active: !!row.metadata?.medjobs_subscription_active,
          interview_terms_accepted_at: row.metadata?.interview_terms_accepted_at ?? null,
          credits_used: row.metadata?.medjobs_credits_used ?? 0,
          // Status fields (computed server-side so the client UI doesn't
          // have to recalculate the 90-day window each render).
          status: status.status,
          pilot_started_at: status.pilotStartedAt?.toISOString() ?? null,
          pilot_ends_at: status.pilotEndsAt?.toISOString() ?? null,
          days_remaining_in_pilot: status.daysRemainingInPilot,
        };
      })
      .filter((row) => {
        if (row.status === "not_client") return false;
        if (!includeExpired && row.status === "pilot_expired") return false;
        return true;
      });

    // Sort: in_pilot (by ending soonest) → subscribed → pilot_expired
    const orderRank: Record<ClientStatus, number> = {
      in_pilot: 0,
      subscribed: 1,
      pilot_expired: 2,
      not_client: 3,
    };
    rows.sort((a, b) => {
      const r = orderRank[a.status] - orderRank[b.status];
      if (r !== 0) return r;
      // Within in_pilot, sort by days remaining ascending
      if (a.status === "in_pilot" && b.status === "in_pilot") {
        return (a.days_remaining_in_pilot ?? 0) - (b.days_remaining_in_pilot ?? 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ rows, total: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/medjobs/clients] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
