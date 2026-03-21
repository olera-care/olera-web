import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getAuthUser, isMasterAdmin } from "@/lib/admin";
import {
  fetchHomeHealthByState,
  fetchNursingHomesByState,
  fetchHospiceByState,
  matchCMSRecords,
  homeHealthToCMSData,
  nursingHomeToCMSData,
  hospiceToCMSData,
} from "@/lib/cms-data";

/**
 * POST /api/admin/import-cms-data
 *
 * Fetches CMS quality data from Medicare APIs, matches against olera-providers
 * by name + ZIP, and stores CMS ratings on matched providers.
 *
 * Query params:
 *   ?state=TX           — process providers in this state (2-letter code)
 *   ?state=all          — process all states in batches of 5
 *   &batch=1            — which batch to process (default 1, only used with state=all)
 *   &source=home_health — "home_health", "nursing_home", "hospice", or "all" (default "home_health")
 *   &dry_run=true       — just count matches, don't write
 *   &force=true         — overwrite existing CMS data
 *
 * Usage:
 *   1. ?state=TX&source=home_health&dry_run=true — dry run one source
 *   2. ?state=TX&source=home_health — import one source
 *   3. ?state=TX&source=all — import all sources (may timeout on large states)
 *   4. ?state=all&source=home_health&batch=1 — process first 5 states
 *   5. ?state=all&source=home_health&batch=2 — process next 5 states, etc.
 */
// Allow up to 60 seconds for CMS API calls
export const maxDuration = 60;

// Support GET so admins can trigger from browser URL bar
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !(await isMasterAdmin(user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const stateParam = searchParams.get("state")?.toUpperCase();
  const source = searchParams.get("source") ?? "home_health";
  const dryRun = searchParams.get("dry_run") === "true";
  const force = searchParams.get("force") === "true";

  if (!stateParam) {
    return NextResponse.json(
      { error: "state parameter required (2-letter code e.g. TX, or 'all')" },
      { status: 400 },
    );
  }

  // --- state=ALL: batch mode ---
  if (stateParam === "ALL") {
    const BATCH_SIZE = 5;
    const batch = Math.max(1, parseInt(searchParams.get("batch") ?? "1", 10));

    const db = getServiceClient();

    try {
      // Get all distinct states from olera-providers
      const { data: stateRows, error: statesErr } = await db
        .from("olera-providers")
        .select("state")
        .or("deleted.is.null,deleted.eq.false")
        .not("state", "is", null);

      if (statesErr) {
        console.error("[import-cms-data] DB error fetching states:", statesErr);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      // Deduplicate and sort
      const stateSet = new Set<string>();
      for (const r of stateRows ?? []) {
        const s = r.state as string;
        if (s && s.length === 2) stateSet.add(s);
      }
      const allStates = Array.from(stateSet).sort();

      const totalBatches = Math.ceil(allStates.length / BATCH_SIZE);
      const startIdx = (batch - 1) * BATCH_SIZE;
      const batchStates = allStates.slice(startIdx, startIdx + BATCH_SIZE);

      if (!batchStates.length) {
        return NextResponse.json({
          message: "No states in this batch",
          batch,
          total_batches: totalBatches,
          total_states: allStates.length,
          all_states: allStates,
        });
      }

      const batchResults: {
        state: string;
        olera_providers: number;
        total_matches: number;
        total_updated: number;
        by_source: {
          source: string;
          cms_records: number;
          matches: number;
          updated: number;
          errors: number;
        }[];
      }[] = [];

      // Process each state in this batch sequentially
      for (const st of batchStates) {
        const stateResult = await processState(db, st, source, dryRun, force);
        batchResults.push(stateResult);
      }

      const hasMore = startIdx + BATCH_SIZE < allStates.length;

      return NextResponse.json({
        message: dryRun ? "Dry run complete (batch)" : "Import complete (batch)",
        dry_run: dryRun,
        mode: "all",
        batch,
        batch_size: BATCH_SIZE,
        total_batches: totalBatches,
        total_states: allStates.length,
        states_processed: batchStates,
        next_batch: hasMore ? batch + 1 : null,
        has_more: hasMore,
        aggregate: {
          olera_providers: batchResults.reduce((s, r) => s + r.olera_providers, 0),
          total_matches: batchResults.reduce((s, r) => s + r.total_matches, 0),
          total_updated: batchResults.reduce((s, r) => s + r.total_updated, 0),
        },
        by_state: batchResults,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[import-cms-data] Unexpected error (all):", message);
      return NextResponse.json({ error: "Internal error", detail: message }, { status: 500 });
    }
  }

  // --- Single state mode ---
  const state = stateParam;
  if (state.length !== 2) {
    return NextResponse.json(
      { error: "state parameter must be a 2-letter code (e.g. TX) or 'all'" },
      { status: 400 },
    );
  }

  const db = getServiceClient();

  try {
    const result = await processState(db, state, source, dryRun, force);

    if (result.olera_providers === 0) {
      return NextResponse.json({
        message: `No eligible providers in ${state}`,
        state,
        provider_count: 0,
      });
    }

    const matchRate = ((result.total_matches / result.olera_providers) * 100).toFixed(1);

    return NextResponse.json({
      message: dryRun ? "Dry run complete" : "Import complete",
      dry_run: dryRun,
      state,
      olera_providers: result.olera_providers,
      total_matches: result.total_matches,
      match_rate: `${matchRate}%`,
      total_updated: result.total_updated,
      by_source: result.by_source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[import-cms-data] Unexpected error:", message);
    return NextResponse.json({ error: "Internal error", detail: message }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof getServiceClient>;

/**
 * Process a single state: fetch providers, fetch CMS data, match, and update.
 */
async function processState(
  db: SupabaseClient,
  state: string,
  source: string,
  dryRun: boolean,
  force: boolean,
) {
  let query = db
    .from("olera-providers")
    .select("provider_id, provider_name, zipcode, address, provider_category")
    .eq("state", state)
    .or("deleted.is.null,deleted.eq.false");

  if (!force) {
    query = query.is("cms_data", null);
  }

  const { data: providers, error: dbErr } = await query;
  if (dbErr) {
    console.error(`[import-cms-data] DB error for ${state}:`, dbErr);
    throw new Error(`DB error for state ${state}`);
  }

  const results: {
    source: string;
    cms_records: number;
    matches: number;
    updated: number;
    errors: number;
  }[] = [];

  if (!providers?.length) {
    return {
      state,
      olera_providers: 0,
      total_matches: 0,
      total_updated: 0,
      by_source: results,
    };
  }

  // --- Home Health ---
  if (source === "all" || source === "home_health") {
    const cmsRecords = await fetchHomeHealthByState(state);
    const matches = matchCMSRecords(
      providers,
      cmsRecords,
      homeHealthToCMSData,
      "provider_name",
      "zip_code",
    );

    let updated = 0;
    let errors = 0;

    if (!dryRun) {
      for (const [providerId, cmsData] of matches) {
        const { error } = await db
          .from("olera-providers")
          .update({ cms_data: cmsData })
          .eq("provider_id", providerId);
        if (error) {
          console.error(`[import-cms-data] Update failed for ${providerId}:`, error);
          errors++;
        } else {
          updated++;
        }
      }
    }

    results.push({
      source: "home_health",
      cms_records: cmsRecords.length,
      matches: matches.size,
      updated,
      errors,
    });
  }

  // --- Nursing Homes ---
  if (source === "all" || source === "nursing_home") {
    const cmsRecords = await fetchNursingHomesByState(state);
    const matches = matchCMSRecords(
      providers,
      cmsRecords,
      nursingHomeToCMSData,
      "provider_name",
      "zip_code",
      "provider_address",
    );

    let updated = 0;
    let errors = 0;

    if (!dryRun) {
      for (const [providerId, cmsData] of matches) {
        const { error } = await db
          .from("olera-providers")
          .update({ cms_data: cmsData })
          .eq("provider_id", providerId);
        if (error) {
          console.error(`[import-cms-data] Update failed for ${providerId}:`, error);
          errors++;
        } else {
          updated++;
        }
      }
    }

    results.push({
      source: "nursing_home",
      cms_records: cmsRecords.length,
      matches: matches.size,
      updated,
      errors,
    });
  }

  // --- Hospice ---
  if (source === "all" || source === "hospice") {
    const cmsRecords = await fetchHospiceByState(state);
    const matches = matchCMSRecords(
      providers,
      cmsRecords,
      hospiceToCMSData,
      "facility_name",
      "zip_code",
      "address_line_1",
    );

    let updated = 0;
    let errors = 0;

    if (!dryRun) {
      for (const [providerId, cmsData] of matches) {
        const { error } = await db
          .from("olera-providers")
          .update({ cms_data: cmsData })
          .eq("provider_id", providerId);
        if (error) {
          console.error(`[import-cms-data] Update failed for ${providerId}:`, error);
          errors++;
        } else {
          updated++;
        }
      }
    }

    results.push({
      source: "hospice",
      cms_records: cmsRecords.length,
      matches: matches.size,
      updated,
      errors,
    });
  }

  const totalMatches = results.reduce((s, r) => s + r.matches, 0);
  const totalUpdated = results.reduce((s, r) => s + r.updated, 0);

  return {
    state,
    olera_providers: providers.length,
    total_matches: totalMatches,
    total_updated: totalUpdated,
    by_source: results,
  };
}
