import type { SupabaseClient } from "@supabase/supabase-js";
import type { AreaAgency } from "@/lib/types/benefits";

/**
 * Who a family should call HERE, for THIS program.
 *
 * Supersedes findLocalAAA, which could only answer "an Area Agency on Aging in
 * this state" and answered it too confidently. Two things went wrong with that
 * on real threads in September 2026:
 *
 *   1. It returned an agency of the wrong KIND. A family asking about LIHEAP
 *      was routed to an aging office, because Area Agencies on Aging were the
 *      only rows in the table. Community Action Agencies run LIHEAP.
 *   2. With no ZIP or county it fell back to the first agency in the state
 *      alphabetically and returned it like any other match. In Georgia that
 *      happened to be right. In Nevada, where meals are administered county by
 *      county, a family a hundred miles from Reno was handed Reno's number.
 *
 * So the state fallback is now a separate, clearly-labelled outcome rather than
 * a match, and callers are expected to treat it as "we do not know yet".
 */
export type MatchQuality = "county" | "zip" | "state_fallback";

export type AgencyType =
  | "area_agency_on_aging"
  | "community_action"
  | "county_senior_services"
  | "county_housing"
  | "information_referral"
  | "other";

export interface LocalProviderResult {
  agency: AreaAgency & { agency_type?: AgencyType; programs_served?: string[] | null };
  matchedBy: MatchQuality;
  /**
   * False when we are guessing. A state fallback must never be presented to a
   * family as their local office: it produces a call to an agency that cannot
   * help them, which costs them the one thing they have least of.
   */
  isLocal: boolean;
}

/** Program id → the kind of office that actually takes the intake call. */
const PROGRAM_INTAKE: Record<string, AgencyType[]> = {
  liheap: ["community_action"],
  "energy-assistance": ["community_action"],
  weatherization: ["community_action"],
  "home-delivered-meals": ["county_senior_services", "area_agency_on_aging"],
  "home-delivered-meals-on-wheels": ["county_senior_services", "area_agency_on_aging"],
  "congregate-meals": ["county_senior_services", "area_agency_on_aging"],
  "home-repair": ["county_housing"],
  "homeowner-rehabilitation": ["county_housing"],
};

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+county$/, "");
}

/**
 * `programId` narrows to the office type that runs it. Omit it and any type is
 * acceptable, which is the right behaviour for "point me at my local aging
 * office" but the wrong one for a specific benefit.
 */
export async function findLocalProvider(
  supabase: SupabaseClient,
  args: { stateCode: string; county?: string | null; zip?: string | null; programId?: string | null },
): Promise<LocalProviderResult | null> {
  const { data, error } = await supabase
    .from("sbf_area_agencies")
    .select("*")
    .eq("state_code", args.stateCode)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  const all = (data ?? []) as LocalProviderResult["agency"][];
  if (!all.length) return null;

  // Prefer offices that run this program, then offices of a type that normally
  // does, then anything. Each step is a widening, so a state with no Community
  // Action Agency on file still returns something rather than nothing.
  const wantedTypes = args.programId ? PROGRAM_INTAKE[args.programId] : undefined;
  const named = args.programId
    ? all.filter((a) => a.programs_served?.includes(args.programId!))
    : [];
  const typed = wantedTypes
    ? all.filter((a) => a.agency_type && wantedTypes.includes(a.agency_type))
    : [];
  const pools = [named, typed, all].filter((p) => p.length);

  for (const pool of pools) {
    if (args.zip) {
      const hit = pool.find((a) => a.zip_codes_served?.includes(args.zip!));
      if (hit) return { agency: hit, matchedBy: "zip", isLocal: true };
    }
    if (args.county) {
      const want = norm(args.county);
      const hit = pool.find((a) => a.counties_served?.some((c) => norm(c) === want));
      if (hit) return { agency: hit, matchedBy: "county", isLocal: true };
    }
  }

  // Nothing matched their actual location. Return the best-typed candidate so a
  // caller has something to name, flagged so it cannot be spoken as local.
  const fallbackPool = pools[0] ?? all;
  return { agency: fallbackPool[0], matchedBy: "state_fallback", isLocal: false };
}
