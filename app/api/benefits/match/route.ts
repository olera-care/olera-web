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
import { zipToState } from "@/lib/benefits/zip-lookup";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

type SupabaseDB = ReturnType<typeof getSupabase>;

// ─── Scoring ──────────────────────────────────────────────────────────────────

function evaluateEligibility(
  program: BenefitProgram,
  answers: BenefitsIntakeAnswers,
  relevantCategories: BenefitCategory[]
): BenefitMatch | null {
  let score = program.priority_score;
  const reasons: string[] = [];

  // Hard disqualify: age below minimum
  if (program.min_age != null && answers.age != null) {
    if (answers.age < program.min_age) return null;
    score += 10;
    reasons.push("Meets age requirement");
  }

  // Income check (soft — no disqualification)
  const income = getEstimatedMonthlyIncome(answers.incomeRange);
  if (income != null && program.max_income_single != null) {
    if (income <= program.max_income_single) {
      score += 15;
      reasons.push("Within income guidelines");
    }
  }

  // Veteran (hard disqualify if required but not met)
  // Web intake doesn't ask veteran status, so skip disqualification
  // but don't give the +20 bonus either

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
    // If they have Medicaid, they may also have Medicare — give partial boost
    score += 5;
  }

  // Category match (largest bonus)
  if (relevantCategories.includes(program.category)) {
    score += 25;
    reasons.push("Matches your care needs");
  }

  score = Math.min(score, 100);

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
