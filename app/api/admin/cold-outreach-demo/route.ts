import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * Cold Outreach Demo API — Simplified
 *
 * Fetches unclaimed providers for a city, with their view counts.
 * No auth required - this is a demo endpoint for presentations.
 */

type ProviderRow = {
  id: string;
  slug: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  created_at: string;
};

type CityCount = {
  city: string;
  state: string;
  count: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    const db = getServiceClient();

    // Always get city counts for the dropdown
    const { data: cityCounts } = await db
      .from("business_profiles")
      .select("city, state")
      .eq("claim_state", "unclaimed")
      .eq("is_active", true)
      .not("city", "is", null);

    const cityMap = new Map<string, number>();
    for (const row of (cityCounts ?? []) as { city: string; state: string }[]) {
      if (!row.city) continue;
      const key = row.state ? `${row.city}, ${row.state}` : row.city;
      cityMap.set(key, (cityMap.get(key) ?? 0) + 1);
    }

    const cities: CityCount[] = Array.from(cityMap.entries())
      .map(([key, count]) => {
        const [cityName, stateName] = key.split(", ");
        return { city: cityName, state: stateName ?? "", count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // If no city selected, just return cities
    if (!city) {
      return NextResponse.json({
        rows: [],
        total: 0,
        cities,
      });
    }

    // Get providers for the selected city
    const [cityName, stateName] = city.split(", ");
    let query = db
      .from("business_profiles")
      .select("id, slug, display_name, email, phone, city, state, category, created_at")
      .eq("claim_state", "unclaimed")
      .eq("is_active", true)
      .eq("city", cityName)
      .order("display_name", { ascending: true });

    if (stateName) {
      query = query.eq("state", stateName);
    }

    const { data: providers, error: providerError } = await query.limit(200);

    if (providerError) {
      console.error("Cold outreach demo - provider fetch error:", providerError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    const providerRows = (providers ?? []) as ProviderRow[];

    // Get view stats for these providers (last 30 days)
    const providerIds = providerRows.map((p) => p.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: viewStats } = await db
      .from("provider_page_view_stats")
      .select("provider_id, raw_view_count")
      .in("provider_id", providerIds.length > 0 ? providerIds : ["__none__"])
      .gte("date", thirtyDaysAgo);

    // Aggregate views per provider
    const viewsByProvider = new Map<string, number>();
    for (const row of (viewStats ?? []) as { provider_id: string; raw_view_count: number }[]) {
      const current = viewsByProvider.get(row.provider_id) ?? 0;
      viewsByProvider.set(row.provider_id, current + row.raw_view_count);
    }

    // Build response
    const rows = providerRows.map((provider) => ({
      id: provider.id,
      slug: provider.slug,
      name: provider.display_name,
      email: provider.email,
      phone: provider.phone,
      city: provider.city,
      state: provider.state,
      category: provider.category,
      views: viewsByProvider.get(provider.id) ?? 0,
      status: "not_contacted" as const,
    }));

    return NextResponse.json({
      rows,
      total: rows.length,
      cities,
    });
  } catch (err) {
    console.error("Cold outreach demo API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
