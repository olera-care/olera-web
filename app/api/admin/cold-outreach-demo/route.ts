import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Cold Outreach Demo API
 *
 * Fetches REAL unclaimed providers from business_profiles and joins with
 * provider_page_view_stats to get actual view counts. Simulates outreach
 * sequence status for demo purposes.
 *
 * This mirrors the staffing-outreach queue API pattern.
 */

type OutreachStage = "not_started" | "sending" | "awaiting_response" | "completed" | "closed";

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

type ViewStatsRow = {
  provider_id: string;
  total_views: number;
};

type CityCount = {
  city: string;
  state: string;
  count: number;
};

// Simulated outreach status per provider (for demo purposes)
// In production, this would come from a cold_outreach table
function getSimulatedOutreachStatus(providerId: string, index: number): {
  stage: OutreachStage;
  sequence_started_at: string | null;
  email1_sent_at: string | null;
  email1_opened: boolean;
  email1_clicked: boolean;
  email2_sent_at: string | null;
  email2_opened: boolean;
  responded: boolean;
} {
  // Use provider ID hash to create consistent but varied statuses
  const hash = providerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = (hash + index) % 10;

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // 60% not started (realistic for cold outreach)
  if (variant < 6) {
    return {
      stage: "not_started",
      sequence_started_at: null,
      email1_sent_at: null,
      email1_opened: false,
      email1_clicked: false,
      email2_sent_at: null,
      email2_opened: false,
      responded: false,
    };
  }

  // 20% sending (in sequence)
  if (variant < 8) {
    return {
      stage: "sending",
      sequence_started_at: daysAgo(2),
      email1_sent_at: daysAgo(2),
      email1_opened: variant === 7,
      email1_clicked: false,
      email2_sent_at: null,
      email2_opened: false,
      responded: false,
    };
  }

  // 15% awaiting response (sequence complete, no reply)
  if (variant === 8) {
    return {
      stage: "awaiting_response",
      sequence_started_at: daysAgo(7),
      email1_sent_at: daysAgo(7),
      email1_opened: true,
      email1_clicked: true,
      email2_sent_at: daysAgo(4),
      email2_opened: true,
      responded: false,
    };
  }

  // 5% completed (claimed their profile)
  return {
    stage: "completed",
    sequence_started_at: daysAgo(14),
    email1_sent_at: daysAgo(14),
    email1_opened: true,
    email1_clicked: true,
    email2_sent_at: daysAgo(11),
    email2_opened: true,
    responded: true,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const stage = searchParams.get("stage") as OutreachStage | null;
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") ?? "0", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

    const db = getServiceClient();

    // 1. Get all unclaimed providers
    let query = db
      .from("business_profiles")
      .select("id, slug, display_name, email, phone, city, state, category, created_at")
      .eq("claim_state", "unclaimed")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Filter by city if specified
    if (city) {
      const [cityName, stateName] = city.split(", ");
      query = query.eq("city", cityName);
      if (stateName) {
        query = query.eq("state", stateName);
      }
    }

    const { data: providers, error: providerError } = await query.limit(500);

    if (providerError) {
      console.error("Cold outreach demo - provider fetch error:", providerError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    const providerRows = (providers ?? []) as ProviderRow[];

    // 2. Get view stats for these providers (aggregate last 30 days)
    const providerIds = providerRows.map((p) => p.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: viewStats, error: viewError } = await db
      .from("provider_page_view_stats")
      .select("provider_id, raw_view_count")
      .in("provider_id", providerIds.length > 0 ? providerIds : ["__none__"])
      .gte("date", thirtyDaysAgo);

    if (viewError) {
      console.error("Cold outreach demo - view stats error:", viewError);
      // Non-fatal, continue without view stats
    }

    // Aggregate views per provider
    const viewsByProvider = new Map<string, number>();
    for (const row of (viewStats ?? []) as { provider_id: string; raw_view_count: number }[]) {
      const current = viewsByProvider.get(row.provider_id) ?? 0;
      viewsByProvider.set(row.provider_id, current + row.raw_view_count);
    }

    // 3. Get city counts for dropdown
    const { data: cityCounts, error: cityError } = await db
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
      .slice(0, 50); // Top 50 cities

    // 4. Build response rows with simulated outreach status
    let rows = providerRows.map((provider, index) => {
      const outreach = getSimulatedOutreachStatus(provider.id, index);
      const views = viewsByProvider.get(provider.id) ?? 0;

      return {
        id: provider.id,
        slug: provider.slug,
        name: provider.display_name,
        email: provider.email,
        phone: provider.phone,
        city: provider.city,
        state: provider.state,
        category: provider.category,
        views,
        created_at: provider.created_at,
        ...outreach,
      };
    });

    // Calculate tab counts BEFORE any filtering (so tabs always show true totals)
    const tabCounts: Record<OutreachStage, number> = {
      not_started: 0,
      sending: 0,
      awaiting_response: 0,
      completed: 0,
      closed: 0,
    };
    for (const row of rows) {
      tabCounts[row.stage]++;
    }

    // Also count providers with views (before filtering)
    const withViewsCount = rows.filter((r) => r.views > 0).length;

    // Filter by search
    if (search) {
      rows = rows.filter((row) => {
        const haystack = [row.name, row.email, row.city, row.state, row.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    // Filter by stage
    if (stage) {
      rows = rows.filter((row) => row.stage === stage);
    }

    // Pagination
    const total = rows.length;
    const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

    return NextResponse.json({
      rows: paginatedRows,
      total,
      tabCounts,
      cities,
      withViewsCount,
    });
  } catch (err) {
    console.error("Cold outreach demo API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
