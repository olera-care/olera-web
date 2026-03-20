import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
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
 * GET /api/cron/cms-refresh
 *
 * Quarterly CMS data refresh. Fetches latest quality data from Medicare APIs
 * and re-matches against all providers.
 *
 * Schedule: 15th of Jan/Apr/Jul/Oct at 6 AM UTC (after CMS quarterly releases)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();

  try {
    // Get distinct states with active providers
    const { data: stateRows, error: stateErr } = await db
      .from("olera-providers")
      .select("state")
      .or("deleted.is.null,deleted.eq.false")
      .not("state", "is", null);

    if (stateErr || !stateRows) {
      console.error("[cms-refresh] Failed to fetch states:", stateErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const states = [...new Set(stateRows.map((r) => r.state as string).filter(Boolean))];

    let totalMatches = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const stateResults: { state: string; matches: number; updated: number }[] = [];

    for (const state of states) {
      // Fetch providers for this state
      const { data: providers } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, zipcode, address, provider_category")
        .eq("state", state)
        .or("deleted.is.null,deleted.eq.false");

      if (!providers?.length) continue;

      let stateMatches = 0;
      let stateUpdated = 0;

      // Home Health
      try {
        const cmsRecords = await fetchHomeHealthByState(state);
        const matches = matchCMSRecords(providers, cmsRecords, homeHealthToCMSData, "provider_name", "zip_code", "address");
        stateMatches += matches.size;

        for (const [providerId, cmsData] of matches) {
          const { error } = await db.from("olera-providers").update({ cms_data: cmsData }).eq("provider_id", providerId);
          if (error) totalErrors++;
          else stateUpdated++;
        }
      } catch (err) {
        console.error(`[cms-refresh] Home Health failed for ${state}:`, err);
      }

      // Nursing Homes
      try {
        const cmsRecords = await fetchNursingHomesByState(state);
        const matches = matchCMSRecords(providers, cmsRecords, nursingHomeToCMSData, "provider_name", "zip_code", "provider_address");
        stateMatches += matches.size;

        for (const [providerId, cmsData] of matches) {
          const { error } = await db.from("olera-providers").update({ cms_data: cmsData }).eq("provider_id", providerId);
          if (error) totalErrors++;
          else stateUpdated++;
        }
      } catch (err) {
        console.error(`[cms-refresh] Nursing Home failed for ${state}:`, err);
      }

      // Hospice
      try {
        const cmsRecords = await fetchHospiceByState(state);
        const matches = matchCMSRecords(providers, cmsRecords, hospiceToCMSData, "facility_name", "zip_code", "address_line_1");
        stateMatches += matches.size;

        for (const [providerId, cmsData] of matches) {
          const { error } = await db.from("olera-providers").update({ cms_data: cmsData }).eq("provider_id", providerId);
          if (error) totalErrors++;
          else stateUpdated++;
        }
      } catch (err) {
        console.error(`[cms-refresh] Hospice failed for ${state}:`, err);
      }

      totalMatches += stateMatches;
      totalUpdated += stateUpdated;
      stateResults.push({ state, matches: stateMatches, updated: stateUpdated });
    }

    console.log(`[cms-refresh] Complete: ${totalUpdated} providers updated across ${states.length} states`);

    return NextResponse.json({
      message: "CMS quarterly refresh complete",
      states_processed: states.length,
      total_matches: totalMatches,
      total_updated: totalUpdated,
      total_errors: totalErrors,
      top_states: stateResults
        .sort((a, b) => b.matches - a.matches)
        .slice(0, 10),
    });
  } catch (err) {
    console.error("[cms-refresh] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
