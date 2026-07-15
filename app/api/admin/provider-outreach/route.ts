import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Batch size for .in() queries to avoid URL length limits.
 * Each UUID is 36 chars; 150 UUIDs ≈ 5400 chars, safely under ~8000 limit.
 */
const IN_CLAUSE_BATCH_SIZE = 150;

/**
 * Helper to batch .in() queries and combine results.
 * Prevents URL length limit issues with large ID arrays.
 */
async function batchedInQuery<T>(
  db: ReturnType<typeof getServiceClient>,
  table: "olera-providers" | "business_profiles" | "provider_outreach_tracking",
  selectColumns: string,
  inColumn: string,
  ids: string[],
  additionalFilters?: { state?: string; city?: string; notDeleted?: boolean }
): Promise<T[]> {
  if (ids.length === 0) return [];

  const results: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CLAUSE_BATCH_SIZE) {
    const batch = ids.slice(i, i + IN_CLAUSE_BATCH_SIZE);
    let query = db.from(table).select(selectColumns).in(inColumn, batch);

    if (additionalFilters?.state) {
      query = query.eq("state", additionalFilters.state);
    }
    if (additionalFilters?.city) {
      query = query.eq("city", additionalFilters.city);
    }
    if (additionalFilters?.notDeleted) {
      query = query.or("deleted.is.null,deleted.eq.false");
    }

    const { data, error } = await query;
    if (error) {
      console.error(`[provider-outreach] Batched query error on ${table}:`, error);
      throw new Error(`Failed to query ${table}`);
    }
    if (data) {
      results.push(...(data as T[]));
    }
  }
  return results;
}

/**
 * Outreach stages and their properties
 */
export const OUTREACH_STAGES = [
  "not_contacted",
  "in_sequence",
  "needs_call",
  "called",
  "claimed",
  "archived",
  "hidden",
] as const;

export type OutreachStage = (typeof OUTREACH_STAGES)[number];

// Called is terminal for our outreach effort (ball is in provider's court)
// Claimed and Archived are also terminal
export const TERMINAL_STAGES: OutreachStage[] = ["called", "claimed", "archived"];

interface ProviderRow {
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  slug: string | null;
}

interface TrackingRow {
  id: string;
  provider_id: string;
  // Use string to allow for legacy "not_interested" values from database
  stage: string;
  city: string | null;
  state: string | null;
  stage_changed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  slug: string | null;
  // Tracking info (if exists)
  tracking_id: string | null;
  stage: OutreachStage;
  stage_changed_at: string | null;
  notes: string | null;
  // For claimed providers
  verification_state?: "verified" | "pending" | "unverified" | "not_required" | "rejected" | null;
}

/**
 * GET /api/admin/provider-outreach
 *
 * List providers by stage with optional city filter.
 *
 * Query params:
 *   - state (required): State to filter by
 *   - stage (optional): Filter by stage (default: "not_contacted")
 *   - city (optional): Filter by city
 *
 * For "not_contacted" stage:
 *   Returns unclaimed providers not in tracking table (or with stage = not_contacted)
 *
 * For other stages:
 *   Returns providers from tracking table with that stage, joined with provider details
 */
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
    const state = searchParams.get("state");
    const stage = (searchParams.get("stage") || "not_contacted") as OutreachStage;
    const city = searchParams.get("city");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    if (!state) {
      return NextResponse.json({ error: "State parameter is required" }, { status: 400 });
    }

    if (!OUTREACH_STAGES.includes(stage)) {
      return NextResponse.json({ error: "Invalid stage parameter" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get stage counts for tabs
    const stageCounts = await getStageCounts(db, state);

    // If search is provided, search across ALL stages and return flat results
    if (search) {
      const searchResults = await searchProviders(db, state, search);
      return NextResponse.json({ providers: searchResults, stage_counts: stageCounts, is_search: true });
    }

    if (stage === "not_contacted") {
      // Special case: providers NOT in tracking OR with stage = not_contacted
      const providers = await getNotContactedProviders(db, state, city);
      return NextResponse.json({ providers, stage_counts: stageCounts });
    }

    if (stage === "claimed") {
      // Special case: "Claimed" shows ACTUAL claimed providers (from business_profiles)
      const providers = await getClaimedProviders(db, state, city);
      return NextResponse.json({ providers, stage_counts: stageCounts });
    }

    // For ALL non-claimed stages: query tracking but exclude providers who have since claimed
    // This ensures a provider only appears in ONE tab (Claimed wins if they've claimed)
    let trackingQuery = db
      .from("provider_outreach_tracking")
      .select("*")
      .eq("state", state);

    // When querying "archived", use special function that merges tracking + system-wide archived
    if (stage === "archived") {
      const providers = await getArchivedProviders(db, state, city);
      return NextResponse.json({ providers, stage_counts: stageCounts });
    }

    // For other stages: query tracking but exclude providers who have since claimed
    trackingQuery = trackingQuery.eq("stage", stage);

    if (city) {
      trackingQuery = trackingQuery.eq("city", city);
    }

    const { data: trackingRows, error: trackingError } = await trackingQuery;

    if (trackingError) {
      console.error("[provider-outreach] Tracking query error:", trackingError);
      return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 500 });
    }

    if (!trackingRows || trackingRows.length === 0) {
      return NextResponse.json({ providers: [], stage_counts: stageCounts });
    }

    // Get provider details for tracked providers
    const providerIds = trackingRows.map((t) => t.provider_id);
    const { data: providerRows, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, email, phone, website, slug")
      .in("provider_id", providerIds);

    if (provError) {
      console.error("[provider-outreach] Provider query error:", provError);
      return NextResponse.json({ error: "Failed to fetch provider details" }, { status: 500 });
    }

    // Exclude providers who have since claimed (they belong in "Claimed" tab now)
    let claimedProviderIds = new Set<string>();
    if (providerIds.length > 0) {
      const { data: claimedBps } = await db
        .from("business_profiles")
        .select("source_provider_id")
        .in("source_provider_id", providerIds)
        .not("account_id", "is", null);

      claimedProviderIds = new Set((claimedBps || []).map((bp) => bp.source_provider_id));
    }

    // Join tracking with provider data
    const providerMap = new Map((providerRows || []).map((p) => [p.provider_id, p as ProviderRow]));
    const providers = (trackingRows as TrackingRow[])
      .map((t): OutreachProvider | null => {
        const p = providerMap.get(t.provider_id);
        if (!p) return null;
        // Skip if provider has claimed - they belong in Claimed tab now
        if (claimedProviderIds.has(p.provider_id)) return null;
        return {
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          provider_category: p.provider_category,
          city: p.city,
          state: p.state,
          email: p.email,
          phone: p.phone,
          website: p.website,
          slug: p.slug,
          tracking_id: t.id,
          stage: t.stage as OutreachStage,
          stage_changed_at: t.stage_changed_at,
          notes: t.notes,
        };
      })
      .filter((p): p is OutreachProvider => p !== null)
      .sort((a, b) => a.provider_name.localeCompare(b.provider_name));

    return NextResponse.json({ providers, stage_counts: stageCounts });
  } catch (err) {
    console.error("[provider-outreach] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * Get providers in "not_contacted" stage:
 * - Not deleted
 * - Not claimed (no business_profile with account_id)
 * - Not in tracking table OR in tracking with stage = not_contacted
 *
 * FIXED: Avoids large IN clauses by querying exclusion sets separately
 */
async function getNotContactedProviders(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  city: string | null
): Promise<OutreachProvider[]> {
  // Step 1: Get all claimed provider IDs (small set ~600 total)
  // We query ALL claimed, then filter in JS - avoids large IN clause
  const { data: allClaimedBps } = await db
    .from("business_profiles")
    .select("source_provider_id")
    .not("source_provider_id", "is", null)
    .not("account_id", "is", null);

  const claimedProviderIds = new Set(
    (allClaimedBps || []).map((bp) => bp.source_provider_id).filter(Boolean)
  );

  // Step 2: Get all tracked provider IDs for this state (filtered by state, small set)
  const { data: trackedInState } = await db
    .from("provider_outreach_tracking")
    .select("provider_id, id, stage, stage_changed_at, notes")
    .eq("state", state);

  const trackedProviderIds = new Set(
    (trackedInState || [])
      .filter((t) => t.stage !== "not_contacted")
      .map((t) => t.provider_id)
  );

  // Build map for not_contacted tracking records (for tracking_id)
  const notContactedMap = new Map(
    (trackedInState || [])
      .filter((t) => t.stage === "not_contacted")
      .map((t) => [t.provider_id, t])
  );

  // Step 3: Get all providers in this state (we need to display them anyway)
  let providerQuery = db
    .from("olera-providers")
    .select("provider_id, provider_name, provider_category, city, state, email, phone, website, slug")
    .eq("state", state)
    .or("deleted.is.null,deleted.eq.false");

  if (city) {
    providerQuery = providerQuery.eq("city", city);
  }

  const { data: providers, error: provError } = await providerQuery;

  if (provError) {
    console.error("[provider-outreach] Provider query error:", provError);
    throw new Error("Failed to fetch providers");
  }

  if (!providers || providers.length === 0) {
    return [];
  }

  // Step 4: Filter in JavaScript (no large IN clause needed)
  const result: OutreachProvider[] = (providers as ProviderRow[])
    .filter((p) => !claimedProviderIds.has(p.provider_id) && !trackedProviderIds.has(p.provider_id))
    .map((p) => {
      const tracking = notContactedMap.get(p.provider_id);
      return {
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        provider_category: p.provider_category,
        city: p.city,
        state: p.state,
        email: p.email,
        phone: p.phone,
        website: p.website,
        slug: p.slug,
        tracking_id: tracking?.id ?? null,
        stage: "not_contacted" as OutreachStage,
        stage_changed_at: tracking?.stage_changed_at ?? null,
        notes: tracking?.notes ?? null,
      };
    })
    .sort((a, b) => a.provider_name.localeCompare(b.provider_name));

  return result;
}

/**
 * Get providers who have ACTUALLY claimed their accounts (from business_profiles)
 * This is the source of truth for "Claimed" - not the tracking table
 */
async function getClaimedProviders(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  city: string | null
): Promise<OutreachProvider[]> {
  // FIXED: Query claimed business_profiles first (small set ~600), then fetch provider details
  // Previous approach queried all providers in state (~10k) and used .in() which exceeded URL limits

  // Step 1: Get all claimed business_profiles with source_provider_id
  const { data: claimedBps, error: bpError } = await db
    .from("business_profiles")
    .select("source_provider_id, created_at, updated_at, verification_state, email")
    .not("source_provider_id", "is", null)
    .not("account_id", "is", null);

  if (bpError) {
    console.error("[provider-outreach] Business profiles query error:", bpError);
    throw new Error("Failed to fetch claimed providers");
  }

  if (!claimedBps || claimedBps.length === 0) {
    return [];
  }

  // Step 2: Get provider details for the claimed ones, filtered by state
  // Uses batched query to avoid URL length limits
  const claimedProviderIds = claimedBps.map((bp) => bp.source_provider_id).filter(Boolean) as string[];

  const providers = await batchedInQuery<ProviderRow>(
    db,
    "olera-providers",
    "provider_id, provider_name, provider_category, city, state, email, phone, website, slug",
    "provider_id",
    claimedProviderIds,
    { state, city: city || undefined, notDeleted: true }
  );

  if (providers.length === 0) {
    return [];
  }

  // Create a map of claimed provider_id -> { timestamp, verification_state, email }
  const claimedMap = new Map(
    claimedBps.map((bp) => [
      bp.source_provider_id,
      {
        timestamp: bp.updated_at || bp.created_at,
        verification_state: bp.verification_state as OutreachProvider["verification_state"],
        email: bp.email as string | null,
      },
    ])
  );

  // Build result with business_profiles email taking precedence
  const result: OutreachProvider[] = (providers as ProviderRow[])
    .map((p) => {
      const claimInfo = claimedMap.get(p.provider_id);
      return {
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        provider_category: p.provider_category,
        city: p.city,
        state: p.state,
        email: claimInfo?.email || p.email,
        phone: p.phone,
        website: p.website,
        slug: p.slug,
        tracking_id: null,
        stage: "claimed" as OutreachStage,
        stage_changed_at: claimInfo?.timestamp || null,
        notes: null,
        verification_state: claimInfo?.verification_state || null,
      };
    })
    .sort((a, b) => a.provider_name.localeCompare(b.provider_name));

  return result;
}

/**
 * Get archived providers from BOTH sources:
 * 1. provider_outreach_tracking where stage = "archived" or "not_interested"
 * 2. business_profiles where metadata.admin_archived = true
 *
 * This ensures providers archived from Questions/Connections also appear here.
 */
async function getArchivedProviders(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  city: string | null
): Promise<OutreachProvider[]> {
  // Track all archived provider IDs to dedupe
  const archivedProviderMap = new Map<string, OutreachProvider>();

  // Step 1: Get providers from tracking table with stage = archived or not_interested
  let trackingQuery = db
    .from("provider_outreach_tracking")
    .select("*")
    .eq("state", state)
    .or("stage.eq.archived,stage.eq.not_interested");

  if (city) {
    trackingQuery = trackingQuery.eq("city", city);
  }

  const { data: trackingRows } = await trackingQuery;

  if (trackingRows && trackingRows.length > 0) {
    const trackingProviderIds = trackingRows.map((t) => t.provider_id);

    // Get provider details
    const { data: providerRows } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, email, phone, website, slug")
      .in("provider_id", trackingProviderIds);

    const providerMap = new Map((providerRows || []).map((p) => [p.provider_id, p as ProviderRow]));

    // Exclude claimed providers
    const { data: claimedBps } = await db
      .from("business_profiles")
      .select("source_provider_id")
      .in("source_provider_id", trackingProviderIds)
      .not("account_id", "is", null);

    const claimedProviderIds = new Set((claimedBps || []).map((bp) => bp.source_provider_id));

    for (const t of trackingRows as TrackingRow[]) {
      const p = providerMap.get(t.provider_id);
      if (!p) continue;
      if (claimedProviderIds.has(p.provider_id)) continue;

      archivedProviderMap.set(p.provider_id, {
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        provider_category: p.provider_category,
        city: p.city,
        state: p.state,
        email: p.email,
        phone: p.phone,
        website: p.website,
        slug: p.slug,
        tracking_id: t.id,
        stage: "archived" as OutreachStage,
        stage_changed_at: t.stage_changed_at,
        notes: t.notes,
      });
    }
  }

  // Step 2: Get system-wide archived providers (admin_archived = true in business_profiles)
  const { data: adminArchivedBps } = await db
    .from("business_profiles")
    .select("source_provider_id, metadata, updated_at")
    .not("source_provider_id", "is", null)
    .filter("metadata->>admin_archived", "eq", "true");

  if (adminArchivedBps && adminArchivedBps.length > 0) {
    const adminArchivedSourceIds = adminArchivedBps
      .map((bp) => bp.source_provider_id)
      .filter(Boolean) as string[];

    // Get provider details from olera-providers, filtered by state
    let providerQuery = db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, email, phone, website, slug")
      .in("provider_id", adminArchivedSourceIds)
      .eq("state", state)
      .or("deleted.is.null,deleted.eq.false");

    if (city) {
      providerQuery = providerQuery.eq("city", city);
    }

    const { data: providerRows } = await providerQuery;

    if (providerRows && providerRows.length > 0) {
      // Exclude claimed providers
      const { data: claimedBps } = await db
        .from("business_profiles")
        .select("source_provider_id")
        .in("source_provider_id", providerRows.map((p) => p.provider_id))
        .not("account_id", "is", null);

      const claimedProviderIds = new Set((claimedBps || []).map((bp) => bp.source_provider_id));

      // Create a map of provider_id -> metadata for archive info
      const metaMap = new Map(
        adminArchivedBps.map((bp) => [
          bp.source_provider_id,
          {
            metadata: bp.metadata as Record<string, unknown>,
            updated_at: bp.updated_at,
          },
        ])
      );

      for (const p of providerRows as ProviderRow[]) {
        // Skip if already in map (tracking takes precedence) or if claimed
        if (archivedProviderMap.has(p.provider_id)) continue;
        if (claimedProviderIds.has(p.provider_id)) continue;

        const bpInfo = metaMap.get(p.provider_id);
        const meta = bpInfo?.metadata ?? {};
        const archiveReason = meta.admin_archived_reason as string | undefined;
        const archiveNotes = meta.admin_archived_notes as string | undefined;
        const archivedAt = (meta.admin_archived_at as string) || bpInfo?.updated_at || null;

        // Build notes string from metadata
        let notes: string | null = null;
        if (archiveReason) {
          notes = archiveNotes ? `${archiveReason} - ${archiveNotes}` : archiveReason;
        }

        archivedProviderMap.set(p.provider_id, {
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          provider_category: p.provider_category,
          city: p.city,
          state: p.state,
          email: p.email,
          phone: p.phone,
          website: p.website,
          slug: p.slug,
          tracking_id: null, // No tracking row for system-archived
          stage: "archived" as OutreachStage,
          stage_changed_at: archivedAt,
          notes,
        });
      }
    }
  }

  // Return all archived providers, sorted by name
  return Array.from(archivedProviderMap.values()).sort((a, b) =>
    a.provider_name.localeCompare(b.provider_name)
  );
}

/**
 * Search providers by name across ALL stages within a state.
 * Returns a flat list with stage info included for each provider.
 */
async function searchProviders(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  search: string
): Promise<OutreachProvider[]> {
  // Get all providers in this state matching the search term
  const { data: providers, error: provError } = await db
    .from("olera-providers")
    .select("provider_id, provider_name, provider_category, city, state, email, phone, website, slug")
    .eq("state", state)
    .or("deleted.is.null,deleted.eq.false")
    .ilike("provider_name", `%${search}%`)
    .limit(100);

  if (provError) {
    console.error("[provider-outreach] Search query error:", provError);
    throw new Error("Failed to search providers");
  }

  if (!providers || providers.length === 0) {
    return [];
  }

  const providerIds = providers.map((p) => p.provider_id);

  // Get claimed providers (have business_profile with account_id)
  const { data: claimedBps } = await db
    .from("business_profiles")
    .select("source_provider_id, created_at, updated_at, verification_state, email")
    .in("source_provider_id", providerIds)
    .not("account_id", "is", null);

  const claimedMap = new Map(
    (claimedBps || []).map((bp) => [
      bp.source_provider_id,
      {
        timestamp: bp.updated_at || bp.created_at,
        verification_state: bp.verification_state as OutreachProvider["verification_state"],
        email: bp.email as string | null,
      },
    ])
  );

  // Get tracking data for all matched providers
  const { data: trackingRows } = await db
    .from("provider_outreach_tracking")
    .select("provider_id, id, stage, stage_changed_at, notes")
    .in("provider_id", providerIds);

  const trackingMap = new Map(
    (trackingRows || []).map((t) => [t.provider_id, t])
  );

  // Get system-wide archived providers (admin_archived = true in business_profiles)
  const { data: adminArchivedBps } = await db
    .from("business_profiles")
    .select("source_provider_id, metadata, updated_at")
    .in("source_provider_id", providerIds)
    .filter("metadata->>admin_archived", "eq", "true");

  const adminArchivedMap = new Map(
    (adminArchivedBps || []).map((bp) => [
      bp.source_provider_id,
      {
        metadata: bp.metadata as Record<string, unknown>,
        updated_at: bp.updated_at,
      },
    ])
  );

  // Build results with stage info
  const result: OutreachProvider[] = (providers as ProviderRow[]).map((p) => {
    const claimInfo = claimedMap.get(p.provider_id);
    const tracking = trackingMap.get(p.provider_id);
    const adminArchived = adminArchivedMap.get(p.provider_id);

    // Determine stage - claimed takes precedence, then check tracking and system archive
    let stage: OutreachStage;
    let stageChangedAt: string | null = null;
    let notes: string | null = null;

    if (claimInfo) {
      stage = "claimed";
      stageChangedAt = claimInfo.timestamp;
    } else if (tracking) {
      // Normalize legacy "not_interested" to "archived"
      stage = tracking.stage === "not_interested" ? "archived" : (tracking.stage as OutreachStage);
      stageChangedAt = tracking.stage_changed_at;
      notes = tracking.notes;
    } else if (adminArchived) {
      // System-wide archived (from Questions/Connections)
      stage = "archived";
      const meta = adminArchived.metadata ?? {};
      stageChangedAt = (meta.admin_archived_at as string) || adminArchived.updated_at || null;
      const archiveReason = meta.admin_archived_reason as string | undefined;
      const archiveNotes = meta.admin_archived_notes as string | undefined;
      if (archiveReason) {
        notes = archiveNotes ? `${archiveReason} - ${archiveNotes}` : archiveReason;
      }
    } else {
      stage = "not_contacted";
    }

    return {
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      provider_category: p.provider_category,
      city: p.city,
      state: p.state,
      email: claimInfo?.email || p.email,
      phone: p.phone,
      website: p.website,
      slug: p.slug,
      tracking_id: tracking?.id ?? null,
      stage,
      stage_changed_at: stageChangedAt,
      notes,
      verification_state: claimInfo?.verification_state || null,
    };
  });

  // Sort by name
  return result.sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

/**
 * Get counts for each stage in a state
 *
 * FIXED: Avoids large IN clauses by querying smaller tables first
 *
 * Key logic:
 * - "claimed" count = actual claimed providers (from business_profiles with account_id)
 * - Active stages (in_sequence, needs_call) = tracking count MINUS those who have since claimed
 * - "called" = terminal for our outreach (ball in provider's court), count MINUS those who claimed
 * - "archived" = tracking count + system-wide archived (admin_archived = true in business_profiles)
 * - "not_contacted" = total providers - claimed - tracked - system-archived
 */
async function getStageCounts(
  db: ReturnType<typeof getServiceClient>,
  state: string
): Promise<Record<OutreachStage, number>> {
  const counts: Record<OutreachStage, number> = {
    not_contacted: 0,
    in_sequence: 0,
    needs_call: 0,
    called: 0,
    claimed: 0,
    archived: 0,
    hidden: 0,
  };

  // Step 1: Get total provider count for this state (just count, not all IDs)
  const { count: totalProviders } = await db
    .from("olera-providers")
    .select("provider_id", { count: "exact", head: true })
    .eq("state", state)
    .or("deleted.is.null,deleted.eq.false");

  if (!totalProviders || totalProviders === 0) {
    return counts;
  }

  // Step 2: Get claimed providers by querying business_profiles first (small set ~600 total)
  // Then filter to those whose source_provider_id exists in olera-providers for this state
  const { data: allClaimedBps } = await db
    .from("business_profiles")
    .select("source_provider_id")
    .not("source_provider_id", "is", null)
    .not("account_id", "is", null);

  // Get the provider IDs that are claimed
  const claimedSourceIds = (allClaimedBps || [])
    .map((bp) => bp.source_provider_id)
    .filter(Boolean) as string[];

  // Now verify which of these are in the target state (using batched query)
  const claimedProviderIds = new Set<string>();

  if (claimedSourceIds.length > 0) {
    const claimedInStateProviders = await batchedInQuery<{ provider_id: string }>(
      db,
      "olera-providers",
      "provider_id",
      "provider_id",
      claimedSourceIds,
      { state, notDeleted: true }
    );

    for (const p of claimedInStateProviders) {
      claimedProviderIds.add(p.provider_id);
    }
  }
  counts.claimed = claimedProviderIds.size;

  // Step 3: Get all tracking rows for this state (small set, filtered by state)
  const { data: trackingRows } = await db
    .from("provider_outreach_tracking")
    .select("provider_id, stage")
    .eq("state", state);

  // Collect all tracked provider IDs and their stages
  const trackedProviderIds = new Set<string>();
  const stageCounts: Record<string, number> = {};

  if (trackingRows) {
    for (const row of trackingRows) {
      let stage = row.stage as string;

      // Handle legacy "not_interested" records - treat as archived
      if (stage === "not_interested") {
        stage = "archived";
      }

      // Skip not_contacted and claimed - they're calculated separately
      if (stage === "not_contacted" || stage === "claimed") {
        continue;
      }

      // Track this provider ID (we'll verify it exists later)
      trackedProviderIds.add(row.provider_id);

      // Skip counting if provider has since claimed
      if (claimedProviderIds.has(row.provider_id)) {
        continue;
      }

      // Accumulate stage counts (we'll adjust after verifying provider existence)
      stageCounts[row.provider_id] = stageCounts[row.provider_id] || 0;
      if (stage in counts) {
        stageCounts[row.provider_id] = stage as unknown as number; // Store the stage for later
      }
    }
  }

  // Step 4: Get system-wide archived providers FIRST (admin_archived = true in business_profiles)
  // We need this before counting stages so we can exclude them from their tracking stage
  const { data: adminArchivedBps } = await db
    .from("business_profiles")
    .select("source_provider_id")
    .not("source_provider_id", "is", null)
    .filter("metadata->>admin_archived", "eq", "true");

  const adminArchivedSourceIds = (adminArchivedBps || [])
    .map((bp) => bp.source_provider_id)
    .filter(Boolean) as string[];

  // Verify which system-archived are in the target state and not claimed
  const systemArchivedProviderIds = new Set<string>();

  if (adminArchivedSourceIds.length > 0) {
    const archivedInStateProviders = await batchedInQuery<{ provider_id: string }>(
      db,
      "olera-providers",
      "provider_id",
      "provider_id",
      adminArchivedSourceIds,
      { state, notDeleted: true }
    );

    for (const p of archivedInStateProviders) {
      if (!claimedProviderIds.has(p.provider_id)) {
        systemArchivedProviderIds.add(p.provider_id);
      }
    }
  }

  // Step 5: Verify tracked providers still exist in olera-providers (not deleted)
  const trackedIds = [...trackedProviderIds];
  const existingTrackedIds = new Set<string>();

  if (trackedIds.length > 0) {
    const existingProviders = await batchedInQuery<{ provider_id: string }>(
      db,
      "olera-providers",
      "provider_id",
      "provider_id",
      trackedIds,
      { state, notDeleted: true }
    );

    for (const p of existingProviders) {
      existingTrackedIds.add(p.provider_id);
    }
  }

  // Now count stages only for providers that still exist, aren't claimed, and aren't system-archived
  // System-archived providers should ONLY be counted in archived (via additionalSystemArchived)
  if (trackingRows) {
    for (const row of trackingRows) {
      let stage = row.stage as string;
      if (stage === "not_interested") stage = "archived";
      if (stage === "not_contacted" || stage === "claimed") continue;
      if (claimedProviderIds.has(row.provider_id)) continue;
      if (!existingTrackedIds.has(row.provider_id)) continue; // Skip deleted providers
      // Skip system-archived - they'll be counted via additionalSystemArchived
      if (systemArchivedProviderIds.has(row.provider_id)) continue;

      if (stage in counts) {
        counts[stage as OutreachStage]++;
      }
    }
  }

  // Step 6: Add system-archived providers to archived count
  // Dedupe: only count those NOT already tracked as archived (via tracking table)
  const trackingArchivedIds = new Set<string>();
  if (trackingRows) {
    for (const row of trackingRows) {
      const stage = row.stage === "not_interested" ? "archived" : row.stage;
      if (stage === "archived" && existingTrackedIds.has(row.provider_id) && !claimedProviderIds.has(row.provider_id)) {
        trackingArchivedIds.add(row.provider_id);
      }
    }
  }

  // System-archived providers: count those not already tracked as archived
  // (They may have tracking rows with different stages, but admin_archived = true takes precedence)
  let additionalSystemArchived = 0;
  for (const pid of systemArchivedProviderIds) {
    if (!trackingArchivedIds.has(pid)) {
      additionalSystemArchived++;
    }
  }
  counts.archived += additionalSystemArchived;

  // Step 7: Calculate not_contacted = total - claimed - tracked (only existing, non-claimed, non-system-archived) - system-archived
  const trackedExistingNotClaimed = [...existingTrackedIds].filter(
    (id) => !claimedProviderIds.has(id) && !systemArchivedProviderIds.has(id)
  ).length;
  counts.not_contacted = Math.max(0, totalProviders - counts.claimed - trackedExistingNotClaimed - additionalSystemArchived);

  return counts;
}
