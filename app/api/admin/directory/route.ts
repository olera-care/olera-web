import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { generateProviderSlug } from "@/lib/slugify";
import { PROVIDER_CATEGORIES } from "@/lib/types";
import type { DirectoryListItem } from "@/lib/types";

/**
 * GET /api/admin/directory
 *
 * List providers with search, filters, and server-side pagination.
 *
 * Union behavior: when a search query is present, the list also includes orphan
 * `business_profiles` rows (source_provider_id IS NULL, type IN (organization,
 * caregiver)) whose display_name matches. This makes BP-only providers
 * (e.g., Aggie Assisted Living) findable by admin search. Without search, the
 * list stays OP-only to preserve existing pagination semantics.
 */
interface OpListRow {
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  google_rating: number | null;
  deleted: boolean | null;
  provider_images: string | null;
  slug: string | null;
}

interface BpListRow {
  id: string;
  display_name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  slug: string | null;
}

// business_profiles uses snake_case enums ("assisted_living") while olera-providers
// uses human-readable strings ("Assisted Living"). Map both directions so admin
// category filtering works across the union and BP rows display consistently.
const BP_TO_OP_CATEGORY: Record<string, string> = {
  assisted_living: "Assisted Living",
  home_care_agency: "Home Care (Non-medical)",
  home_health_agency: "Home Health Care",
  independent_living: "Independent Living",
  memory_care: "Memory Care",
  hospice_agency: "Hospice",
  rehab_facility: "Rehab Facility",
};

const OP_TO_BP_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(BP_TO_OP_CATEGORY).map(([bp, op]) => [op, bp])
);

function displayBpCategory(category: string | null): string {
  if (!category) return "";
  return BP_TO_OP_CATEGORY[category] ?? category;
}

function mapOpToItem(row: OpListRow): DirectoryListItem {
  const images = row.provider_images
    ? (row.provider_images as string).split(" | ").filter(Boolean)
    : [];
  return {
    provider_id: row.provider_id,
    provider_name: row.provider_name,
    provider_category: row.provider_category ?? "",
    city: row.city,
    state: row.state,
    google_rating: row.google_rating,
    deleted: row.deleted ?? false,
    hero_image_url: null,
    has_images: images.length > 0,
    image_count: images.length,
    source: "olera-providers",
    slug: row.slug,
  };
}

function mapBpToItem(row: BpListRow): DirectoryListItem {
  return {
    provider_id: row.id,
    provider_name: row.display_name,
    provider_category: displayBpCategory(row.category),
    city: row.city,
    state: row.state,
    google_rating: null,
    deleted: false,
    hero_image_url: null,
    has_images: !!row.image_url,
    image_count: row.image_url ? 1 : 0,
    source: "business_profiles",
    slug: row.slug,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "";
    const stateFilter = searchParams.get("state") || "";
    const tab = searchParams.get("tab") || "all";
    const countOnly = searchParams.get("count_only") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "50", 10)));

    const db = getServiceClient();

    // BPs have no `deleted` column, so they only join the union when the tab
    // allows them. `deleted` tab is OP-only. Everything else includes BPs when
    // search is present.
    const includeBps = search.length > 0 && tab !== "deleted";

    // --- Count mode -----------------------------------------------------
    if (countOnly) {
      let opCountQuery = db
        .from("olera-providers")
        .select("provider_id", { count: "exact", head: true });

      if (tab === "published") opCountQuery = (opCountQuery as any).or("deleted.is.null,deleted.eq.false");
      else if (tab === "deleted") opCountQuery = (opCountQuery as any).eq("deleted", true);
      else if (tab === "no_city") opCountQuery = (opCountQuery as any).is("city", null);
      if (search) opCountQuery = (opCountQuery as any).ilike("provider_name", `%${search}%`);
      if (category) opCountQuery = (opCountQuery as any).eq("provider_category", category);
      if (stateFilter) opCountQuery = (opCountQuery as any).eq("state", stateFilter);

      const opCountResult = await opCountQuery;
      if (opCountResult.error) {
        console.error("Directory count error:", opCountResult.error);
        return NextResponse.json({ error: "Failed to count providers" }, { status: 500 });
      }
      const opCount = opCountResult.count ?? 0;

      let bpCount = 0;
      if (includeBps) {
        let bpCountQuery = db
          .from("business_profiles")
          .select("id", { count: "exact", head: true })
          .in("type", ["organization", "caregiver"])
          .is("source_provider_id", null);

        if (tab === "no_city") bpCountQuery = (bpCountQuery as any).is("city", null);
        bpCountQuery = (bpCountQuery as any).ilike("display_name", `%${search}%`);
        if (category) {
          const bpCategory = OP_TO_BP_CATEGORY[category];
          // If no mapping exists, filter will match nothing — that's correct
          // (the OP category has no BP equivalent).
          bpCountQuery = (bpCountQuery as any).eq("category", bpCategory ?? "__no_match__");
        }
        if (stateFilter) bpCountQuery = (bpCountQuery as any).eq("state", stateFilter);

        const bpCountResult = await bpCountQuery;
        if (bpCountResult.error) {
          console.error("Directory BP count error:", bpCountResult.error);
        } else {
          bpCount = bpCountResult.count ?? 0;
        }
      }

      return NextResponse.json({ total: opCount + bpCount });
    }

    // --- List mode ------------------------------------------------------
    // Strategy: when union is inactive, query OP with normal pagination.
    // When union is active, fetch the OP page plus ALL matching orphan BPs
    // (bounded set, ~110 total per Esther's analysis), merge, sort,
    // slice to per_page. Pagination remains approximately correct because
    // the BP set is small and the merge happens per page.
    const opColumns =
      "provider_id, provider_name, provider_category, city, state, google_rating, deleted, provider_images, slug";

    let opQuery = db.from("olera-providers").select(opColumns, { count: "exact" });

    if (tab === "published") opQuery = (opQuery as any).or("deleted.is.null,deleted.eq.false");
    else if (tab === "deleted") opQuery = (opQuery as any).eq("deleted", true);
    else if (tab === "no_city") opQuery = (opQuery as any).is("city", null);
    if (search) opQuery = (opQuery as any).ilike("provider_name", `%${search}%`);
    if (category) opQuery = (opQuery as any).eq("provider_category", category);
    if (stateFilter) opQuery = (opQuery as any).eq("state", stateFilter);
    opQuery = (opQuery as any).order("provider_name", { ascending: true });

    // Without union: preserve existing behavior — direct pagination on OP.
    if (!includeBps) {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      const { data, count, error } = await opQuery.range(from, to);

      if (error) {
        console.error("Directory list error:", error);
        return NextResponse.json(
          { error: `Failed to fetch providers: ${error.message}` },
          { status: 500 }
        );
      }

      const total = count ?? 0;
      const totalPages = Math.ceil(total / perPage);
      const providers: DirectoryListItem[] = (data ?? []).map((row) =>
        mapOpToItem(row as OpListRow)
      );

      return NextResponse.json({
        providers,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      });
    }

    // Union path: fetch OP page-worth + all orphan BPs matching filters.
    // For page N, OP rows are alphabetically slots [0..N*perPage], so fetching
    // up to N*perPage + BP_SAFETY_CAP guarantees we cover everything that
    // could land on this page after interleaving with BPs.
    // PostgREST default max-rows is 1000, so clamp our fetch to stay under it.
    // Practical impact: for a search with >1000 matches, deep pagination
    // beyond roughly page 10 may skip rows. Admin searches are narrowly
    // scoped so this is rare — documented tradeoff of the band-aid.
    const BP_SAFETY_CAP = 500;
    const opFetchLimit = Math.min(1000, page * perPage + BP_SAFETY_CAP);
    const opResult = await opQuery.range(0, opFetchLimit - 1);

    if (opResult.error) {
      console.error("Directory list OP error:", opResult.error);
      return NextResponse.json(
        { error: `Failed to fetch providers: ${opResult.error.message}` },
        { status: 500 }
      );
    }
    const opTotal = opResult.count ?? 0;

    let bpQuery = db
      .from("business_profiles")
      .select("id, display_name, category, city, state, image_url, slug", { count: "exact" })
      .in("type", ["organization", "caregiver"])
      .is("source_provider_id", null);

    if (tab === "no_city") bpQuery = (bpQuery as any).is("city", null);
    bpQuery = (bpQuery as any).ilike("display_name", `%${search}%`);
    if (category) {
      const bpCategory = OP_TO_BP_CATEGORY[category];
      bpQuery = (bpQuery as any).eq("category", bpCategory ?? "__no_match__");
    }
    if (stateFilter) bpQuery = (bpQuery as any).eq("state", stateFilter);
    bpQuery = (bpQuery as any).order("display_name", { ascending: true }).limit(BP_SAFETY_CAP);

    const bpResult = await bpQuery;
    if (bpResult.error) {
      console.error("Directory list BP error:", bpResult.error);
      // Fall through with empty BP results — don't fail the whole request.
    }
    const bpTotal = bpResult.count ?? 0;

    const opItems = (opResult.data ?? []).map((row) => mapOpToItem(row as OpListRow));
    const bpItems = (bpResult.data ?? []).map((row) => mapBpToItem(row as BpListRow));

    const merged = [...opItems, ...bpItems];
    merged.sort((a, b) => a.provider_name.localeCompare(b.provider_name));

    const from = (page - 1) * perPage;
    const pageSlice = merged.slice(from, from + perPage);

    const total = opTotal + bpTotal;
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      providers: pageSlice,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (err) {
    console.error("Directory list error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/directory
 *
 * Create a new provider with minimal required fields.
 * Redirects to detail page for full editing.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const providerName = (body.provider_name || "").trim();
    const providerCategory = (body.provider_category || "").trim();

    if (!providerName) {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 });
    }
    if (!providerCategory || !PROVIDER_CATEGORIES.includes(providerCategory)) {
      return NextResponse.json({ error: "Valid provider category is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const providerId = crypto.randomUUID();
    const baseSlug = generateProviderSlug(providerName, null);

    // Ensure slug uniqueness — append random suffix if base slug exists
    let slug = baseSlug;
    const { data: existing } = await db
      .from("olera-providers")
      .select("provider_id")
      .eq("slug", baseSlug)
      .limit(1);
    if (existing && existing.length > 0) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const { error: insertError } = await db
      .from("olera-providers")
      .insert({
        provider_id: providerId,
        provider_name: providerName,
        provider_category: providerCategory,
        slug,
        deleted: false,
        deleted_at: null,
      });

    if (insertError) {
      console.error("Directory create error:", insertError);
      return NextResponse.json(
        { error: `Failed to create provider: ${insertError.message}` },
        { status: 500 }
      );
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "create_directory_provider",
      targetType: "directory_provider",
      targetId: providerId,
      details: {
        provider_name: providerName,
        provider_category: providerCategory,
        slug,
      },
    });

    return NextResponse.json({ provider: { provider_id: providerId } }, { status: 201 });
  } catch (err) {
    console.error("Directory create error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
