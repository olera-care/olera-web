import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/** Map user care_types (ProfileCategory) to olera-providers provider_category values */
const categoryToSupabaseCategory: Record<string, string> = {
  home_care_agency: "Home Care (Non-medical)",
  home_health_agency: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  independent_living: "Independent Living",
  nursing_home: "Nursing Home",
  hospice_agency: "Hospice",
  inpatient_hospice: "Hospice",
  rehab_facility: "Nursing Home",
  adult_day_care: "Home Care (Non-medical)",
  wellness_center: "Home Care (Non-medical)",
  private_caregiver: "Home Care (Non-medical)",
};

/**
 * POST /api/matches/fetch
 *
 * Returns matched providers for the authenticated family user.
 * Filters by care types, state, excludes dismissed & existing connections.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      sort = "relevance",
      offset = 0,
      limit = 20,
    } = body as { sort?: string; offset?: number; limit?: number };

    // Get user's family profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json({ error: "No active profile" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("business_profiles")
      .select("id, care_types, city, state, type")
      .eq("id", account.active_profile_id)
      .single();

    if (!profile || profile.type !== "family") {
      return NextResponse.json({ error: "Family profile required" }, { status: 400 });
    }

    // Map user care_types to provider categories
    const providerCategories = (profile.care_types || [])
      .map((ct: string) => categoryToSupabaseCategory[ct])
      .filter(Boolean);

    if (providerCategories.length === 0 || !profile.state) {
      return NextResponse.json({ providers: [], totalCount: 0 });
    }

    // Get dismissed & connected provider IDs to exclude
    const { data: existingConnections } = await supabase
      .from("connections")
      .select("to_profile_id")
      .eq("from_profile_id", profile.id)
      .in("type", ["dismiss", "inquiry"]);

    const excludeProfileIds = (existingConnections || []).map(
      (c: { to_profile_id: string }) => c.to_profile_id
    );

    // Also get source_provider_ids for those profiles so we can exclude from olera-providers
    let excludeProviderIds: string[] = [];
    if (excludeProfileIds.length > 0) {
      const { data: excludedProfiles } = await supabase
        .from("business_profiles")
        .select("source_provider_id")
        .in("id", excludeProfileIds)
        .not("source_provider_id", "is", null);

      excludeProviderIds = (excludedProfiles || [])
        .map((p: { source_provider_id: string | null }) => p.source_provider_id)
        .filter(Boolean) as string[];
    }

    // Build category filter using ilike (provider_category can be pipe-separated like "Assisted Living | Independent Living")
    // Replace parentheses with _ wildcard — PostgREST .or() uses () for logical grouping
    const categoryFilter = [...new Set<string>(providerCategories)]
      .map((cat: string) => {
        const escaped = cat.replace(/[()]/g, "_");
        return `provider_category.ilike.%${escaped}%`;
      })
      .join(",");

    // Query olera-providers
    let query = supabase
      .from("olera-providers")
      .select("*", { count: "exact" })
      .not("deleted", "is", true)
      .eq("state", profile.state)
      .or(categoryFilter)
      .not("provider_images", "is", null);

    // Exclude already-dismissed/connected providers
    if (excludeProviderIds.length > 0) {
      query = query.not(
        "provider_id",
        "in",
        `(${excludeProviderIds.join(",")})`
      );
    }

    // Sort
    if (sort === "highest_rated") {
      query = query.order("google_rating", { ascending: false, nullsFirst: false });
    } else if (sort === "closest" && profile.city) {
      // Same city first, then by rating
      query = query
        .order("city", { ascending: true })
        .order("google_rating", { ascending: false, nullsFirst: false });
    } else {
      // Default: relevance = by rating
      query = query.order("google_rating", { ascending: false, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: providers, count, error } = await query;

    if (error) {
      console.error("Matches fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
    }

    return NextResponse.json({
      providers: providers || [],
      totalCount: count || 0,
    });
  } catch (err) {
    console.error("Matches fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
