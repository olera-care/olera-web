import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * Cold Outreach Demo API
 *
 * Fetches unclaimed providers with simulated outreach status.
 * No auth required - this is a demo endpoint.
 *
 * Key design decisions:
 * - Only counts providers WITH emails in tab counts (actionable work)
 * - Simulated status is deterministic based on provider ID
 * - Supports "marking as sent" via POST for demo purposes
 */

type OutreachStage = "to_send" | "sent" | "claimed" | "needs_followup";

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

// Simulated outreach status based on provider ID
// Only applies to providers WITH emails (others are always "to_send" but non-actionable)
function getSimulatedStatus(providerId: string, index: number): {
  stage: OutreachStage;
  email1_sent_at: string | null;
  email1_opened: boolean;
  email2_sent_at: string | null;
  email2_opened: boolean;
} {
  const hash = providerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = (hash + index) % 10;

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // 60% to_send
  if (variant < 6) {
    return {
      stage: "to_send",
      email1_sent_at: null,
      email1_opened: false,
      email2_sent_at: null,
      email2_opened: false,
    };
  }

  // 20% sent (in sequence)
  if (variant < 8) {
    return {
      stage: "sent",
      email1_sent_at: daysAgo(2),
      email1_opened: variant === 7,
      email2_sent_at: variant === 7 ? daysAgo(1) : null,
      email2_opened: false,
    };
  }

  // 10% claimed
  if (variant === 8) {
    return {
      stage: "claimed",
      email1_sent_at: daysAgo(10),
      email1_opened: true,
      email2_sent_at: daysAgo(7),
      email2_opened: true,
    };
  }

  // 10% needs_followup
  return {
    stage: "needs_followup",
    email1_sent_at: daysAgo(14),
    email1_opened: false,
    email2_sent_at: daysAgo(11),
    email2_opened: false,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const stage = searchParams.get("stage") as OutreachStage | null;
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") ?? "0", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

    const db = getServiceClient();

    // Get city counts for dropdown (only count providers WITH emails)
    const { data: cityCounts } = await db
      .from("business_profiles")
      .select("city, state, email")
      .eq("claim_state", "unclaimed")
      .eq("is_active", true)
      .not("city", "is", null)
      .not("email", "is", null); // Only providers with emails

    const cityMap = new Map<string, number>();
    for (const row of (cityCounts ?? []) as { city: string; state: string; email: string }[]) {
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

    // Get providers (include all, but we'll separate contactable vs non-contactable)
    let query = db
      .from("business_profiles")
      .select("id, slug, display_name, email, phone, city, state, category, created_at")
      .eq("claim_state", "unclaimed")
      .eq("is_active", true)
      .order("display_name", { ascending: true });

    if (city) {
      const [cityName, stateName] = city.split(", ");
      query = query.eq("city", cityName);
      if (stateName) {
        query = query.eq("state", stateName);
      }
    }

    const { data: providers, error: providerError } = await query.limit(1000);

    if (providerError) {
      console.error("Cold outreach demo - provider fetch error:", providerError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    const providerRows = (providers ?? []) as ProviderRow[];

    // Get view stats
    const providerIds = providerRows.map((p) => p.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: viewStats } = await db
      .from("provider_page_view_stats")
      .select("provider_id, raw_view_count")
      .in("provider_id", providerIds.length > 0 ? providerIds : ["__none__"])
      .gte("date", thirtyDaysAgo);

    const viewsByProvider = new Map<string, number>();
    for (const row of (viewStats ?? []) as { provider_id: string; raw_view_count: number }[]) {
      const current = viewsByProvider.get(row.provider_id) ?? 0;
      viewsByProvider.set(row.provider_id, current + row.raw_view_count);
    }

    // Build rows with simulated status
    let rows = providerRows.map((provider, index) => {
      const hasEmail = !!provider.email;
      // Only apply simulated status to providers with emails
      // Providers without emails are "to_send" but non-actionable
      const status = hasEmail
        ? getSimulatedStatus(provider.id, index)
        : {
            stage: "to_send" as OutreachStage,
            email1_sent_at: null,
            email1_opened: false,
            email2_sent_at: null,
            email2_opened: false,
          };

      return {
        id: provider.id,
        slug: provider.slug,
        name: provider.display_name,
        email: provider.email,
        phone: provider.phone,
        city: provider.city,
        state: provider.state,
        category: provider.category,
        views: viewsByProvider.get(provider.id) ?? 0,
        hasEmail,
        ...status,
      };
    });

    // Calculate tab counts - ONLY for providers WITH emails (actionable)
    const contactableRows = rows.filter((r) => r.hasEmail);
    const tabCounts: Record<OutreachStage, number> = {
      to_send: 0,
      sent: 0,
      claimed: 0,
      needs_followup: 0,
    };
    for (const row of contactableRows) {
      tabCounts[row.stage]++;
    }

    // Also track total with/without email for stats
    const totalWithEmail = contactableRows.length;
    const totalWithoutEmail = rows.length - totalWithEmail;

    // Filter by search (applies to all rows)
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
      stats: {
        totalWithEmail,
        totalWithoutEmail,
      },
    });
  } catch (err) {
    console.error("Cold outreach demo API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
