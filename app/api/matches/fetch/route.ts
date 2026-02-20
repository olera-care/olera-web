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

/** Dismissals older than this many days are ignored so matches refresh */
const DISMISS_COOLDOWN_DAYS = 7;

/** Normalize state input to 2-letter uppercase code (olera-providers format) */
const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

function normalizeState(raw: string): string {
  const trimmed = raw.trim();
  // Already a 2-letter code
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  // Full state name
  const code = STATE_NAME_TO_CODE[trimmed.toLowerCase()];
  if (code) return code;
  // Fallback: uppercase whatever was provided
  return trimmed.toUpperCase();
}

const MATCH_COLUMNS =
  "provider_id, provider_name, provider_logo, provider_images, provider_category, provider_description, city, state, google_rating, lower_price, upper_price, contact_for_price";

/**
 * POST /api/matches/fetch
 *
 * Returns matched providers for the authenticated family user.
 * Filters by care types + state, excludes active connections and recently dismissed.
 * Falls back to broader criteria if strict matching returns too few results.
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
      limit = 50,
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

    if (!profile.state) {
      console.log("[matches] No state set — care_types:", profile.care_types);
      return NextResponse.json({ providers: [], totalCount: 0 });
    }

    const matchState = normalizeState(profile.state);
    console.log("[matches] Searching — state:", profile.state, "→", matchState, "categories:", providerCategories, "care_types:", profile.care_types);

    // Get recently dismissed & active connection provider IDs to exclude
    // Only exclude dismissals from the last N days so matches refresh over time
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - DISMISS_COOLDOWN_DAYS);
    const cooldownISO = cooldownDate.toISOString();

    const { data: existingConnections } = await supabase
      .from("connections")
      .select("to_profile_id, type, metadata, created_at")
      .eq("from_profile_id", profile.id)
      .in("type", ["save", "inquiry"]);

    // Exclude: active inquiries (always) + recently dismissed (within cooldown)
    const excludeProfileIds = (existingConnections || [])
      .filter(
        (c: {
          type: string;
          metadata?: Record<string, unknown>;
          created_at: string;
        }) => {
          if (c.type === "inquiry") return true;
          if (
            c.type === "save" &&
            (c.metadata as Record<string, unknown>)?.dismissed
          ) {
            return c.created_at > cooldownISO;
          }
          return false;
        }
      )
      .map((c: { to_profile_id: string }) => c.to_profile_id);

    // Resolve source_provider_ids for excluded profiles
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

    // Shared exclusion filter for provider_id
    const excludeFilter =
      excludeProviderIds.length > 0
        ? `(${excludeProviderIds.join(",")})`
        : null;

    // Sort helper — builds ordering on any query builder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applySortAndRange = (q: any) => {
      let sorted = q;
      if (sort === "highest_rated") {
        sorted = sorted.order("google_rating", { ascending: false, nullsFirst: false });
      } else if (sort === "closest" && profile.city) {
        sorted = sorted
          .order("city", { ascending: true })
          .order("google_rating", { ascending: false, nullsFirst: false });
      } else {
        sorted = sorted.order("google_rating", { ascending: false, nullsFirst: false });
      }
      return sorted.range(offset, offset + limit - 1);
    };

    // --- Strategy 1: strict match (same state + matching categories) ---
    let providers: Record<string, unknown>[] | null = null;
    let count: number | null = null;

    if (providerCategories.length > 0) {
      const categoryFilter = [...new Set<string>(providerCategories)]
        .map((cat: string) => {
          const escaped = cat.replace(/[()]/g, "_");
          return `provider_category.ilike.%${escaped}%`;
        })
        .join(",");

      let strictQuery = supabase
        .from("olera-providers")
        .select(MATCH_COLUMNS, { count: "exact" })
        .not("deleted", "is", true)
        .eq("state", matchState)
        .or(categoryFilter);

      if (excludeFilter) {
        strictQuery = strictQuery.not("provider_id", "in", excludeFilter);
      }

      const { data, count: c, error } = await applySortAndRange(strictQuery);
      if (error) {
        console.error("Matches strict fetch error:", error);
      } else {
        providers = data;
        count = c;
      }
    }

    // --- Strategy 2: fallback — same state, any category (if strict returned <5) ---
    if (!providers || providers.length < 5) {
      console.log(
        "[matches] Strict returned",
        providers?.length ?? 0,
        "— broadening to same state, any category"
      );

      let broadQuery = supabase
        .from("olera-providers")
        .select(MATCH_COLUMNS, { count: "exact" })
        .not("deleted", "is", true)
        .eq("state", matchState);

      if (excludeFilter) {
        broadQuery = broadQuery.not("provider_id", "in", excludeFilter);
      }

      const { data, count: c, error } = await applySortAndRange(broadQuery);
      if (error) {
        console.error("Matches broad fetch error:", error);
      } else if (data && data.length > (providers?.length ?? 0)) {
        // Merge: strict results first (they're more relevant), then broad results
        if (providers && providers.length > 0) {
          const strictIds = new Set(
            providers.map((p) => (p as { provider_id: string }).provider_id)
          );
          const extra = data.filter(
            (p: Record<string, unknown>) => !strictIds.has(p.provider_id as string)
          );
          providers = [...providers, ...extra].slice(0, limit);
          count = c;
        } else {
          providers = data;
          count = c;
        }
      }
    }

    console.log(
      "[matches] Results:",
      count,
      "total,",
      providers?.length ?? 0,
      "returned, excluded:",
      excludeProviderIds.length,
      "provider IDs"
    );

    return NextResponse.json({
      providers: providers || [],
      totalCount: count || 0,
    });
  } catch (err) {
    console.error("Matches fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
