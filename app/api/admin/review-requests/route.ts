import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface ProviderEngagement {
  id: string;
  display_name: string;
  slug: string;
  requests_sent: number;
  requests_this_month: number;
  olera_reviews_count: number;
  google_connected: boolean;
  last_request_at: string | null;
}

interface EmailLogRow {
  provider_id: string;
  created_at: string;
  metadata: {
    delivery_method?: string;
  } | null;
}

interface ReviewRequestLogRow {
  provider_id: string;
  request_count: number;
  sent_count: number;
  delivery_method: string;
  created_at: string;
}

interface BusinessProfileRow {
  id: string;
  display_name: string;
  slug: string;
  metadata: {
    google_metadata?: {
      google_place_id?: string;
    };
  } | null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const period = searchParams.get("period") || "all";
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const db = getServiceClient();

  // Calculate date filter based on period
  let dateFilter: string | null = null;
  const now = new Date();
  if (period === "7d") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (period === "30d") {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (period === "90d") {
    dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Get this month's start date for "this month" calculations
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    // Fetch all review request emails (from email_log)
    let emailQuery = db
      .from("email_log")
      .select("provider_id, created_at, metadata")
      .eq("email_type", "review_request");

    if (dateFilter) {
      emailQuery = (emailQuery as any).gte("created_at", dateFilter);
    }

    const { data: emailLogs, error: emailError } = await emailQuery;

    if (emailError) {
      console.error("Failed to fetch email logs:", emailError);
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    const typedEmailLogs = (emailLogs || []) as EmailLogRow[];

    // Aggregate by provider
    const providerStats = new Map<
      string,
      {
        requests_sent: number;
        requests_this_month: number;
        last_request_at: string | null;
        by_method: { email: number; link: number; sms: number };
      }
    >();

    for (const log of typedEmailLogs) {
      const providerId = log.provider_id;
      const existing = providerStats.get(providerId) || {
        requests_sent: 0,
        requests_this_month: 0,
        last_request_at: null,
        by_method: { email: 0, link: 0, sms: 0 },
      };

      existing.requests_sent++;

      // Check if this month
      if (log.created_at >= monthStart) {
        existing.requests_this_month++;
      }

      // Track last request
      if (!existing.last_request_at || log.created_at > existing.last_request_at) {
        existing.last_request_at = log.created_at;
      }

      // Track delivery method
      const method = log.metadata?.delivery_method || "email";
      if (method === "email") existing.by_method.email++;
      else if (method === "link") existing.by_method.link++;
      else if (method === "sms") existing.by_method.sms++;

      providerStats.set(providerId, existing);
    }

    // Get provider details for all providers that have sent requests
    const providerIds = Array.from(providerStats.keys());

    if (providerIds.length === 0) {
      return NextResponse.json({
        summary: {
          total_requests: 0,
          total_providers: 0,
          requests_this_month: 0,
          by_method: { email: 0, link: 0, sms: 0 },
        },
        providers: [],
        total: 0,
      });
    }

    // Fetch provider profiles
    let profileQuery = db
      .from("business_profiles")
      .select("id, display_name, slug, metadata")
      .in("id", providerIds);

    if (search) {
      profileQuery = (profileQuery as any).or(
        `display_name.ilike.%${search}%,slug.ilike.%${search}%`
      );
    }

    const { data: profiles, error: profileError } = await profileQuery;

    if (profileError) {
      console.error("Failed to fetch profiles:", profileError);
      return NextResponse.json({ error: "Failed to fetch provider data" }, { status: 500 });
    }

    const typedProfiles = (profiles || []) as BusinessProfileRow[];

    // Get Olera review counts per provider slug
    const slugs = typedProfiles.map((p) => p.slug).filter(Boolean);
    const { data: oleraReviews } = await db
      .from("olera_reviews")
      .select("provider_slug")
      .in("provider_slug", slugs)
      .eq("flagged", false);

    const oleraCountsBySlug = new Map<string, number>();
    for (const review of oleraReviews || []) {
      const slug = review.provider_slug;
      oleraCountsBySlug.set(slug, (oleraCountsBySlug.get(slug) || 0) + 1);
    }

    // Build provider engagement list
    const providerEngagement: ProviderEngagement[] = typedProfiles
      .map((profile) => {
        const stats = providerStats.get(profile.id);
        if (!stats) return null;

        const googleMetadata = profile.metadata?.google_metadata;
        const hasGooglePlaceId = !!(googleMetadata?.google_place_id);

        return {
          id: profile.id,
          display_name: profile.display_name || "Unknown",
          slug: profile.slug || "",
          requests_sent: stats.requests_sent,
          requests_this_month: stats.requests_this_month,
          olera_reviews_count: oleraCountsBySlug.get(profile.slug) || 0,
          google_connected: hasGooglePlaceId,
          last_request_at: stats.last_request_at,
        };
      })
      .filter((p): p is ProviderEngagement => p !== null)
      .sort((a, b) => b.requests_sent - a.requests_sent);

    // Calculate summary stats
    let totalRequests = 0;
    let requestsThisMonth = 0;
    const byMethod = { email: 0, link: 0, sms: 0 };

    for (const stats of providerStats.values()) {
      totalRequests += stats.requests_sent;
      requestsThisMonth += stats.requests_this_month;
      byMethod.email += stats.by_method.email;
      byMethod.link += stats.by_method.link;
      byMethod.sms += stats.by_method.sms;
    }

    // Apply pagination
    const paginatedProviders = providerEngagement.slice(offset, offset + limit);

    return NextResponse.json({
      summary: {
        total_requests: totalRequests,
        total_providers: providerStats.size,
        requests_this_month: requestsThisMonth,
        by_method: byMethod,
      },
      providers: paginatedProviders,
      total: providerEngagement.length,
    });
  } catch (err) {
    console.error("Review requests admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
