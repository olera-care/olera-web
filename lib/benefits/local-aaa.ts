import type { SupabaseClient } from "@supabase/supabase-js";
import type { AreaAgency } from "@/lib/types/benefits";

/**
 * Find the family's local Area Agency on Aging from sbf_area_agencies.
 *
 * Routing quality depends entirely on how much location we hold:
 *   ZIP match > county match > state fallback (first agency alphabetically).
 *
 * The state fallback is WRONG for most multi-agency states (TX has 57
 * agencies, CA 33) — callers that can't supply a ZIP or county should treat a
 * `matchedBy: "state"` result as low-confidence and prefer the Eldercare
 * Locator (800-677-1116) in family-facing copy. As of 2026-07,
 * zip_codes_served is empty across all 431 rows; counties_served is populated
 * on 421 — county is the real routing key.
 *
 * Extracted from app/api/benefits/match/route.ts so the benefits-outcome
 * "I want help" page can reuse it.
 */
export async function findLocalAAA(
  supabase: SupabaseClient,
  stateCode: string,
  zip: string | null,
  county: string | null,
): Promise<{ agency: AreaAgency; matchedBy: "zip" | "county" | "state" } | null> {
  const { data, error } = await supabase
    .from("sbf_area_agencies")
    .select("*")
    // The table stopped being AAA-only in migration 199: it now also holds
    // Community Action Agencies, county senior services and housing offices,
    // and 2-1-1 lines. This function's whole contract is "the Area Agency on
    // Aging", and its callers say exactly that to families, so it has to ask
    // for one. Without the filter Nevada returned "Nevada 2-1-1" as a family's
    // Area Agency on Aging, and every county match was one alphabetical
    // accident away from returning a housing office instead.
    //
    // migration 199 backfilled all 431 pre-existing rows to this type, so the
    // filter returns exactly the set this function saw before.
    .eq("agency_type", "area_agency_on_aging")
    .eq("state_code", stateCode)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const agencies = data as AreaAgency[];

  if (zip) {
    const zipMatch = agencies.find((a) => a.zip_codes_served?.includes(zip));
    if (zipMatch) return { agency: zipMatch, matchedBy: "zip" };
  }

  if (county) {
    const normalizedCounty = county.toLowerCase().trim();
    const countyMatch = agencies.find((a) =>
      a.counties_served?.some((c) => c.toLowerCase().trim() === normalizedCounty),
    );
    if (countyMatch) return { agency: countyMatch, matchedBy: "county" };
  }

  return { agency: agencies[0], matchedBy: "state" };
}
