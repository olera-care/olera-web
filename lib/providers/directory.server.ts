import type { SupabaseClient } from "@supabase/supabase-js";
import type { DirectoryListItem } from "@/lib/types";

/**
 * Admin directory reads — the OP + orphan-BP union behind the front door.
 *
 * The `/admin/directory` list, count, and CSV export all reconcile two tables:
 * the `olera-providers` directory and orphan `business_profiles` (claimed-but-
 * unlinked org/caregiver accounts, `source_provider_id IS NULL`). This module
 * centralizes that reconciliation — the category mapping, the `includeBps` rule,
 * the filter application, and the paginated merge — so the routes are thin and
 * the dual-table logic lives in one place. Reads only; the directory POST
 * (create) write stays in the route until the writes-consolidation sub-step.
 *
 * Relocated parity-first from `app/api/admin/directory/route.ts` and
 * `.../export/route.ts`; behavior is identical, including the documented
 * deep-pagination band-aid on the union path.
 */

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
  Object.entries(BP_TO_OP_CATEGORY).map(([bp, op]) => [op, bp]),
);

function displayBpCategory(category: string | null): string {
  if (!category) return "";
  return BP_TO_OP_CATEGORY[category] ?? category;
}

export interface DirectoryFilters {
  search: string;
  category: string;
  state: string;
  tab: string;
}

/**
 * BPs join the union only when there's a search query and the tab isn't the
 * OP-only `deleted` tab (BPs have no `deleted` column).
 */
function computeIncludeBps(filters: DirectoryFilters): boolean {
  return filters.search.length > 0 && filters.tab !== "deleted";
}

// The query builders below are intentionally `any`-typed: PostgREST's
// PostgrestFilterBuilder generics are painful to thread through conditional
// chaining, and the original routes already cast `as any` at each step. Public
// signatures stay fully typed; only this internal plumbing is loose.

/** Apply the OP-side directory filters (tab / search / category / state). */
function applyOpFilters(q: any, filters: DirectoryFilters): any {
  let query = q;
  if (filters.tab === "published") query = query.or("deleted.is.null,deleted.eq.false");
  else if (filters.tab === "deleted") query = query.eq("deleted", true);
  else if (filters.tab === "no_city") query = query.is("city", null);
  if (filters.search) query = query.ilike("provider_name", `%${filters.search}%`);
  if (filters.category) query = query.eq("provider_category", filters.category);
  if (filters.state) query = query.eq("state", filters.state);
  return query;
}

/**
 * Apply the orphan-BP base + filters: type IN (org, caregiver),
 * source_provider_id IS NULL, then no_city / search / mapped-category / state.
 * Only ever invoked when `includeBps` is true (so search is always present).
 */
function applyBpFilters(q: any, filters: DirectoryFilters): any {
  let query = q.in("type", ["organization", "caregiver"]).is("source_provider_id", null);
  if (filters.tab === "no_city") query = query.is("city", null);
  query = query.ilike("display_name", `%${filters.search}%`);
  if (filters.category) {
    // If no mapping exists, the filter matches nothing — correct (the OP
    // category has no BP equivalent).
    query = query.eq("category", OP_TO_BP_CATEGORY[filters.category] ?? "__no_match__");
  }
  if (filters.state) query = query.eq("state", filters.state);
  return query;
}

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

/**
 * Total count across OP + (when applicable) orphan BPs. Throws on the OP count
 * error so the route can surface a 500; a BP count error degrades to 0 (matches
 * the original's "log and continue").
 */
export async function countDirectory(
  filters: DirectoryFilters,
  db: SupabaseClient,
): Promise<number> {
  const opCountResult = await applyOpFilters(
    db.from("olera-providers").select("provider_id", { count: "exact", head: true }),
    filters,
  );
  if (opCountResult.error) {
    console.error("Directory count error:", opCountResult.error);
    throw new Error("Failed to count providers");
  }
  const opCount = opCountResult.count ?? 0;

  let bpCount = 0;
  if (computeIncludeBps(filters)) {
    const bpCountResult = await applyBpFilters(
      db.from("business_profiles").select("id", { count: "exact", head: true }),
      filters,
    );
    if (bpCountResult.error) {
      console.error("Directory BP count error:", bpCountResult.error);
    } else {
      bpCount = bpCountResult.count ?? 0;
    }
  }

  return opCount + bpCount;
}

export interface DirectoryListPage {
  providers: DirectoryListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const OP_LIST_COLUMNS =
  "provider_id, provider_name, provider_category, city, state, google_rating, deleted, provider_images, slug";

/**
 * Paginated directory list. Without union (no search, or deleted tab) this is a
 * direct OP page. With union it fetches a page-worth of OP plus all matching
 * orphan BPs (bounded), merges, sorts, and slices — the documented deep-page
 * band-aid is preserved exactly. Throws on the OP error (route → 500); a BP
 * error degrades to empty BP results.
 */
export async function listDirectory(
  filters: DirectoryFilters,
  page: number,
  perPage: number,
  db: SupabaseClient,
): Promise<DirectoryListPage> {
  const opQuery = applyOpFilters(
    db.from("olera-providers").select(OP_LIST_COLUMNS, { count: "exact" }),
    filters,
  ).order("provider_name", { ascending: true });

  // Without union: preserve existing behavior — direct pagination on OP.
  if (!computeIncludeBps(filters)) {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const { data, count, error } = await opQuery.range(from, to);
    if (error) {
      console.error("Directory list error:", error);
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }
    const total = count ?? 0;
    return {
      providers: (data ?? []).map((row: OpListRow) => mapOpToItem(row)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    };
  }

  // Union path: fetch OP page-worth + all orphan BPs matching filters.
  // For page N, OP rows are alphabetically slots [0..N*perPage], so fetching up
  // to N*perPage + BP_SAFETY_CAP guarantees we cover everything that could land
  // on this page after interleaving with BPs. PostgREST default max-rows is
  // 1000, so clamp the fetch to stay under it. Practical impact: for a search
  // with >1000 matches, deep pagination beyond ~page 10 may skip rows. Admin
  // searches are narrowly scoped so this is rare — documented tradeoff.
  const BP_SAFETY_CAP = 500;
  const opFetchLimit = Math.min(1000, page * perPage + BP_SAFETY_CAP);
  const opResult = await opQuery.range(0, opFetchLimit - 1);
  if (opResult.error) {
    console.error("Directory list OP error:", opResult.error);
    throw new Error(`Failed to fetch providers: ${opResult.error.message}`);
  }
  const opTotal = opResult.count ?? 0;

  const bpResult = await applyBpFilters(
    db
      .from("business_profiles")
      .select("id, display_name, category, city, state, image_url, slug", { count: "exact" }),
    filters,
  )
    .order("display_name", { ascending: true })
    .limit(BP_SAFETY_CAP);

  if (bpResult.error) {
    console.error("Directory list BP error:", bpResult.error);
    // Fall through with empty BP results — don't fail the whole request.
  }
  const bpTotal = bpResult.count ?? 0;

  const opItems = (opResult.data ?? []).map((row: OpListRow) => mapOpToItem(row));
  const bpItems = (bpResult.data ?? []).map((row: BpListRow) => mapBpToItem(row));

  const merged = [...opItems, ...bpItems];
  merged.sort((a, b) => a.provider_name.localeCompare(b.provider_name));

  const from = (page - 1) * perPage;
  const pageSlice = merged.slice(from, from + perPage);

  const total = opTotal + bpTotal;
  return {
    providers: pageSlice,
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

interface OpExportRow {
  provider_name: string | null;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  google_rating: number | null;
  deleted: boolean | null;
}

interface BpExportRow {
  display_name: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface DirectoryExportRow {
  name: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  rating: string;
  status: string;
  source: string;
}

export interface DirectoryExportResult {
  rows: DirectoryExportRow[];
  opCount: number;
  bpCount: number;
}

const OP_EXPORT_COLUMNS =
  "provider_name, provider_category, city, state, phone, email, website, google_rating, deleted";

/**
 * Full filtered export rows (OP paginated in 1000-row pages + orphan BPs when
 * union is active), merged and name-sorted. Returns the per-source counts for
 * the route's audit log. Throws on an OP page error (route → 500); a BP error
 * degrades to empty BP rows. CSV formatting stays in the route (presentation).
 */
export async function exportDirectoryRows(
  filters: DirectoryFilters,
  db: SupabaseClient,
): Promise<DirectoryExportResult> {
  // OP with Supabase 1000-row pagination.
  const PAGE_SIZE = 1000;
  let allOpRows: OpExportRow[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const query = applyOpFilters(
      db.from("olera-providers").select(OP_EXPORT_COLUMNS),
      filters,
    )
      .order("provider_name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data: pageData, error: pageError } = await query;
    if (pageError) {
      console.error("Directory export OP error:", pageError);
      throw new Error("Failed to export providers");
    }
    const rows = (pageData ?? []) as OpExportRow[];
    allOpRows = allOpRows.concat(rows);
    offset += PAGE_SIZE;
    hasMore = rows.length === PAGE_SIZE;
  }

  // Orphan BPs (only when search is active).
  let allBpRows: BpExportRow[] = [];
  if (computeIncludeBps(filters)) {
    const { data: bpData, error: bpError } = await applyBpFilters(
      db.from("business_profiles").select("display_name, category, city, state, phone, email, website"),
      filters,
    ).order("display_name", { ascending: true });
    if (bpError) {
      console.error("Directory export BP error:", bpError);
    } else {
      allBpRows = (bpData ?? []) as BpExportRow[];
    }
  }

  const rows: DirectoryExportRow[] = [
    ...allOpRows.map<DirectoryExportRow>((row) => ({
      name: row.provider_name ?? "",
      category: row.provider_category ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      website: row.website ?? "",
      rating: row.google_rating != null ? String(row.google_rating) : "",
      status: row.deleted ? "Deleted" : "Published",
      source: "olera-providers",
    })),
    ...allBpRows.map<DirectoryExportRow>((row) => ({
      name: row.display_name ?? "",
      category: displayBpCategory(row.category),
      city: row.city ?? "",
      state: row.state ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      website: row.website ?? "",
      rating: "",
      status: "Published",
      source: "business_profiles",
    })),
  ];
  rows.sort((a, b) => a.name.localeCompare(b.name));

  return { rows, opCount: allOpRows.length, bpCount: allBpRows.length };
}
