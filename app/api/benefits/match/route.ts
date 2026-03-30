import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  BenefitsIntakeAnswers,
  BenefitProgram,
  BenefitMatch,
  AreaAgency,
  BenefitsSearchResult,
  BenefitCategory,
} from "@/lib/types/benefits";
import {
  getTierLabel,
  getEstimatedMonthlyIncome,
  needsToCategories,
} from "@/lib/types/benefits";
import { zipToState, zipToCounty } from "@/lib/benefits/zip-lookup";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

type SupabaseDB = ReturnType<typeof getSupabase>;

// ─── Care Setting Heuristic ──────────────────────────────────────────────────

const HOME_KEYWORDS = [
  "home", "hcbs", "home-based", "in-home", "homemaker", "home health",
  "home care", "community-based", "aging in place", "home modification",
];
const FACILITY_KEYWORDS = [
  "facility", "nursing", "assisted living", "nursing home", "residential",
  "institutional", "skilled nursing",
];

function inferCareSetting(programName: string): "home" | "facility" | "any" {
  const lower = programName.toLowerCase();
  const isHome = HOME_KEYWORDS.some((kw) => lower.includes(kw));
  const isFacility = FACILITY_KEYWORDS.some((kw) => lower.includes(kw));
  if (isHome && !isFacility) return "home";
  if (isFacility && !isHome) return "facility";
  return "any";
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function evaluateEligibility(
  program: BenefitProgram,
  answers: BenefitsIntakeAnswers,
  relevantCategories: BenefitCategory[]
): BenefitMatch | null {
  // Normalize base score to 0-50 range to leave room for bonuses
  let score = Math.round(program.priority_score * 0.5);
  const reasons: string[] = [];

  // Hard disqualify: age below minimum
  if (program.min_age != null && answers.age != null) {
    if (answers.age < program.min_age) return null;
    score += 8;
    reasons.push("Meets age requirement");
  }

  // Income check — hard disqualify if over threshold
  const income = getEstimatedMonthlyIncome(answers.incomeRange);
  if (income != null && program.max_income_single != null) {
    if (income <= program.max_income_single) {
      score += 12;
      reasons.push("Within income guidelines");
    } else {
      return null; // Hard disqualify — income exceeds program threshold
    }
  }

  // Veteran — hard disqualify unless user explicitly says "yes"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requiresVeteran = (program as any).requires_veteran;
  if (requiresVeteran === true) {
    if (answers.veteranStatus === "yes") {
      score += 15;
      reasons.push("Veteran benefit");
    } else {
      return null; // Hard disqualify — only show veteran programs to confirmed veterans
    }
  }

  // Disability (hard disqualify if required but not met)
  // Web intake doesn't ask disability status, so skip disqualification

  // Medicaid
  const hasMedicaid = answers.medicaidStatus === "alreadyHas";
  if (program.requires_medicaid) {
    if (!hasMedicaid) return null;
    score += 10;
    reasons.push("Has Medicaid");
  }

  // Medicare (soft — no disqualification)
  if (program.requires_medicare && hasMedicaid) {
    score += 5;
  }

  // Category match — hard disqualify if no overlap with user's needs
  if (relevantCategories.length > 0 && !relevantCategories.includes(program.category)) {
    return null; // Hard disqualify — program category doesn't match any selected needs
  }
  if (relevantCategories.includes(program.category)) {
    score += 15;
    reasons.push("Matches your care needs");
  }

  // Care preference — boost/penalize based on home vs facility
  if (answers.carePreference && answers.carePreference !== "unsure") {
    const setting = inferCareSetting(program.name);
    if (answers.carePreference === "stayHome") {
      if (setting === "home") {
        score += 8;
        reasons.push("Supports staying at home");
      } else if (setting === "facility") {
        score -= 8;
      }
    } else if (answers.carePreference === "exploringFacility") {
      if (setting === "facility") {
        score += 8;
        reasons.push("Facility-based program");
      }
    }
  }

  score = Math.max(0, Math.min(score, 100));

  return {
    id: program.id,
    program,
    matchScore: score,
    matchReasons: reasons.length > 0 ? reasons : ["May be eligible"],
    tierLabel: getTierLabel(score),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function fetchFederalPrograms(
  supabase: SupabaseDB
): Promise<BenefitProgram[]> {
  const { data, error } = await supabase
    .from("sbf_federal_programs")
    .select("*")
    .eq("is_active", true)
    .order("priority_score", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BenefitProgram[];
}

async function fetchStatePrograms(
  supabase: SupabaseDB,
  stateCode: string
): Promise<BenefitProgram[]> {
  const { data, error } = await supabase
    .from("sbf_state_programs")
    .select("*")
    .eq("state_code", stateCode)
    .eq("is_active", true)
    .order("priority_score", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BenefitProgram[];
}

async function findLocalAAA(
  supabase: SupabaseDB,
  stateCode: string,
  zip: string | null,
  county: string | null
): Promise<AreaAgency | null> {
  const { data, error } = await supabase
    .from("sbf_area_agencies")
    .select("*")
    .eq("state_code", stateCode)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const agencies = data as AreaAgency[];

  // Priority 1: ZIP match
  if (zip) {
    const zipMatch = agencies.find(
      (a) => a.zip_codes_served?.includes(zip)
    );
    if (zipMatch) return zipMatch;
  }

  // Priority 2: County match
  if (county) {
    const normalizedCounty = county.toLowerCase().trim();
    const countyMatch = agencies.find((a) =>
      a.counties_served?.some(
        (c) => c.toLowerCase().trim() === normalizedCounty
      )
    );
    if (countyMatch) return countyMatch;
  }

  // Fallback: first agency in the state
  return agencies[0];
}

// ─── Match & Deduplicate ─────────────────────────────────────────────────────

function matchPrograms(
  federal: BenefitProgram[],
  state: BenefitProgram[],
  answers: BenefitsIntakeAnswers
): BenefitMatch[] {
  const relevantCategories = needsToCategories(answers.primaryNeeds);
  const seen = new Set<string>();
  const matches: BenefitMatch[] = [];

  for (const program of [...federal, ...state]) {
    const key = program.name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    const match = evaluateEligibility(program, answers, relevantCategories);
    if (match) matches.push(match);
  }

  // Sort by score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  // Limit to top 20
  return matches.slice(0, 20);
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const answers: BenefitsIntakeAnswers = await request.json();

    // Derive state from ZIP if not provided
    const stateCode =
      answers.stateCode || (answers.zipCode ? zipToState(answers.zipCode) : null);

    if (!stateCode) {
      return NextResponse.json(
        { error: "Could not determine state from ZIP code" },
        { status: 400 }
      );
    }

    // Resolve county from ZIP if not already set
    if (!answers.county && answers.zipCode) {
      answers.county = await zipToCounty(answers.zipCode);
    }

    const supabase = getSupabase();

    // Fetch all data concurrently
    const [federal, state, localAAA] = await Promise.all([
      fetchFederalPrograms(supabase),
      fetchStatePrograms(supabase, stateCode),
      findLocalAAA(supabase, stateCode, answers.zipCode, answers.county),
    ]);

    const matchedPrograms = matchPrograms(federal, state, answers);

    const result: BenefitsSearchResult = {
      federalPrograms: federal,
      statePrograms: state,
      localAAA,
      matchedPrograms,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[benefits/match]", err);
    return NextResponse.json(
      { error: "Failed to find matching programs" },
      { status: 500 }
    );
  }
}
