import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { allStates } from "@/data/waiver-library";
import type { BenefitCategory } from "@/lib/types/benefits";
import { buildWaiverLibraryUrl } from "@/lib/benefits/state-utils";

/**
 * GET/POST /api/admin/seed-sbf-programs
 *
 * Parses the 528-program waiver library into structured BenefitProgram rows
 * and upserts them into `sbf_state_programs`.
 *
 * Query params:
 *   dry_run=true — preview without writing (GET defaults to dry_run)
 *   state=TX — seed only one state
 *   confirm=true — required on GET to actually write (safety rail)
 */
export async function GET(request: NextRequest) {
  // GET defaults to dry_run unless confirm=true
  const { searchParams } = new URL(request.url);
  if (!searchParams.has("dry_run") && !searchParams.has("confirm")) {
    searchParams.set("dry_run", "true");
  }
  return handleSeed(request);
}

export async function POST(request: NextRequest) {
  return handleSeed(request);
}

async function handleSeed(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const dryRun = searchParams.get("dry_run") === "true";
    const stateFilter = searchParams.get("state")?.toUpperCase();

    const db = getServiceClient();
    const programs: Record<string, unknown>[] = [];

    for (const state of allStates) {
      if (stateFilter && state.abbreviation !== stateFilter) continue;

      for (const program of state.programs) {
        const parsed = parseEligibility(program.eligibilityHighlights);
        const category = inferCategory(program.name, program.description, program.eligibilityHighlights);

        programs.push({
          id: `${state.abbreviation.toLowerCase()}-${program.id}`,
          name: program.name,
          short_name: program.shortName || null,
          description: program.description,
          category,
          min_age: parsed.minAge,
          max_income_single: parsed.maxIncomeSingle,
          max_income_couple: parsed.maxIncomeCouple,
          requires_disability: parsed.requiresDisability,
          requires_veteran: parsed.requiresVeteran,
          requires_medicaid: parsed.requiresMedicaid,
          requires_medicare: parsed.requiresMedicare,
          phone: program.phone || null,
          website: program.forms?.[0]?.url || null,
          application_url: program.forms?.[0]?.url || null,
          what_to_say: null,
          priority_score: computePriorityScore(category, parsed),
          is_active: true,
          state_code: state.abbreviation,
          savings_range: program.savingsRange || null,
          waiver_library_url: buildWaiverLibraryUrl(state.abbreviation, program.id),
          source_url: program.sourceUrl || null,
          last_verified_date: program.lastVerifiedDate || null,
          verified_by: program.verifiedBy || null,
          savings_source: program.savingsSource || null,
          savings_verified: program.savingsVerified ?? false,
        });
      }
    }

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        total: programs.length,
        states: [...new Set(programs.map((p) => p.state_code))].length,
        sample: programs.slice(0, 5),
        categories: countByField(programs, "category"),
        has_income: programs.filter((p) => p.max_income_single != null).length,
        has_age: programs.filter((p) => p.min_age != null).length,
        has_savings_range: programs.filter((p) => p.savings_range != null).length,
        has_waiver_url: programs.filter((p) => p.waiver_library_url != null).length,
        requires_medicaid: programs.filter((p) => p.requires_medicaid).length,
        requires_veteran: programs.filter((p) => p.requires_veteran).length,
        has_source_url: programs.filter((p) => p.source_url != null).length,
        has_verified_date: programs.filter((p) => p.last_verified_date != null).length,
        savings_verified: programs.filter((p) => p.savings_verified).length,
      });
    }

    // Deactivate all existing rows so old iOS data stops appearing in results
    const { error: deactivateError } = await db
      .from("sbf_state_programs")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Failed to deactivate old rows:", deactivateError);
      return NextResponse.json({
        error: "Failed to deactivate existing programs",
        details: deactivateError.message,
      }, { status: 500 });
    }

    // Upsert in batches of 50
    let upserted = 0;
    let errors = 0;
    const errorDetails: { batch: number; message: string; code: string }[] = [];
    for (let i = 0; i < programs.length; i += 50) {
      const batch = programs.slice(i, i + 50);
      const { error } = await db
        .from("sbf_state_programs")
        .upsert(batch, { onConflict: "id" });

      if (error) {
        console.error(`Batch ${i} error:`, error);
        errors++;
        errorDetails.push({ batch: i, message: error.message, code: error.code });
      } else {
        upserted += batch.length;
      }
    }

    return NextResponse.json({
      success: errors === 0,
      deactivated_old_rows: true,
      upserted,
      errors,
      error_details: errorDetails.slice(0, 5),
      total: programs.length,
    });
  } catch (err) {
    console.error("Seed SBF programs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Parsing helpers ────────────────────────────────────────────────────────

interface ParsedEligibility {
  minAge: number | null;
  maxIncomeSingle: number | null;
  maxIncomeCouple: number | null;
  requiresDisability: boolean;
  requiresVeteran: boolean;
  requiresMedicaid: boolean;
  requiresMedicare: boolean;
}

function parseEligibility(highlights: string[]): ParsedEligibility {
  const result: ParsedEligibility = {
    minAge: null,
    maxIncomeSingle: null,
    maxIncomeCouple: null,
    requiresDisability: false,
    requiresVeteran: false,
    requiresMedicaid: false,
    requiresMedicare: false,
  };

  const text = highlights.join(" ").toLowerCase();

  // Age extraction: "age 65", "65 or older", "65+", "age 21+"
  const ageMatch = text.match(/(?:age\s+)?(\d{2,3})\s*(?:\+|or older|and older|or above)/);
  if (ageMatch) {
    result.minAge = parseInt(ageMatch[1], 10);
  }

  // Income extraction: "$X/month", "$X per month", "$X/mo"
  const incomeMatches = text.match(/\$[\d,]+(?:\.\d{2})?\s*\/?\s*(?:per\s+)?(?:month|mo\b)/gi);
  if (incomeMatches) {
    const amounts = incomeMatches.map((m) => {
      const num = m.replace(/[^0-9.]/g, "");
      return parseFloat(num);
    }).filter((n) => !isNaN(n) && n > 0);

    if (amounts.length === 1) {
      result.maxIncomeSingle = amounts[0];
    } else if (amounts.length >= 2) {
      // Lower amount is single, higher is couple
      amounts.sort((a, b) => a - b);
      result.maxIncomeSingle = amounts[0];
      result.maxIncomeCouple = amounts[1];
    }
  }

  // Annual income: "$X/year" or "$X per year" — convert to monthly
  if (!result.maxIncomeSingle) {
    const annualMatch = text.match(/\$[\d,]+(?:\.\d{2})?\s*\/?\s*(?:per\s+)?(?:year|annually)/i);
    if (annualMatch) {
      const amount = parseFloat(annualMatch[0].replace(/[^0-9.]/g, ""));
      if (!isNaN(amount) && amount > 0) {
        result.maxIncomeSingle = Math.round(amount / 12);
      }
    }
  }

  // Requirements
  if (text.includes("medicaid") && (text.includes("require") || text.includes("must have") || text.includes("enrolled in") || text.includes("eligible for medicaid"))) {
    result.requiresMedicaid = true;
  }
  if (text.includes("medicare")) {
    result.requiresMedicare = true;
  }
  if (text.includes("veteran") || text.includes("va ") || text.includes("military service")) {
    result.requiresVeteran = true;
  }
  if (text.includes("disab") || text.includes("blind") || text.includes("impairment")) {
    result.requiresDisability = true;
  }

  return result;
}

function inferCategory(name: string, description: string, highlights: string[]): BenefitCategory {
  const text = `${name} ${description} ${highlights.join(" ")}`.toLowerCase();

  if (text.includes("caregiver") || text.includes("respite") || text.includes("family support")) {
    return "caregiver";
  }
  if (text.includes("snap") || text.includes("food") || text.includes("nutrition") || text.includes("meals")) {
    return "food";
  }
  if (text.includes("housing") || text.includes("section 8") || text.includes("rent") || text.includes("home modification")) {
    return "housing";
  }
  if (text.includes("energy") || text.includes("liheap") || text.includes("utility") || text.includes("weatherization") || text.includes("lifeline")) {
    return "utilities";
  }
  if (text.includes("ssi") || text.includes("supplemental security") || text.includes("cash") || text.includes("financial assistance")) {
    return "income";
  }
  // Default: most waiver programs are healthcare
  return "healthcare";
}

function computePriorityScore(
  category: BenefitCategory,
  parsed: ParsedEligibility
): number {
  // Base score by category (healthcare waivers are highest value)
  let score = 50;
  if (category === "healthcare") score = 60;
  if (category === "income") score = 55;

  // Boost if has specific eligibility criteria (more targeted = higher relevance)
  if (parsed.maxIncomeSingle != null) score += 5;
  if (parsed.minAge != null) score += 5;
  if (parsed.requiresMedicaid) score += 5;

  return Math.min(score, 80); // Cap to leave room for match bonuses
}

function countByField(
  items: Record<string, unknown>[],
  field: string
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = String(item[field] ?? "unknown");
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}
