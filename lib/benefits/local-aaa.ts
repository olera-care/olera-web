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
