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
 *   ?state=TX           — process providers in this state (required)
 *   &source=all         — "home_health", "nursing_home", "hospice", or "all" (default "all")
 *   &dry_run=true       — just count matches, don't write
 *   &force=true         — overwrite existing CMS data
 *
 * Usage:
 *   1. ?state=TX&dry_run=true to see match counts
 *   2. ?state=TX to import
 *   3. Repeat for each state with providers
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !(await isMasterAdmin(user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const state = searchParams.get("state")?.toUpperCase();
  const source = searchParams.get("source") ?? "all";
  const dryRun = searchParams.get("dry_run") === "true";
  const force = searchParams.get("force") === "true";

  if (!state || state.length !== 2) {
    return NextResponse.json(
      { error: "state parameter required (2-letter code, e.g. TX)" },
      { status: 400 },
    );
  }

  const db = getServiceClient();

  try {
    // Fetch our providers in this state
    let query = db
      .from("olera-providers")
      .select("provider_id, provider_name, zipcode, provider_category")
      .eq("state", state)
      .or("deleted.is.null,deleted.eq.false");

    if (!force) {
      query = query.is("cms_data", null);
    }

    const { data: providers, error: dbErr } = await query;
    if (dbErr) {
      console.error("[import-cms-data] DB error:", dbErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!providers?.length) {
      return NextResponse.json({
        message: `No eligible providers in ${state}`,
        state,
        provider_count: 0,
      });
    }

    const results: {
      source: string;
      cms_records: number;
      matches: number;
      updated: number;
      errors: number;
    }[] = [];

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
    const matchRate = ((totalMatches / providers.length) * 100).toFixed(1);

    return NextResponse.json({
      message: dryRun ? "Dry run complete" : "Import complete",
      dry_run: dryRun,
      state,
      olera_providers: providers.length,
      total_matches: totalMatches,
      match_rate: `${matchRate}%`,
      total_updated: totalUpdated,
      by_source: results,
    });
  } catch (err) {
    console.error("[import-cms-data] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
