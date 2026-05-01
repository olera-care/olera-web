/**
 * Phase 0.1 verification: confirm Arm B's "$400-$900/month often goes unclaimed"
 * subhead is credible against real matched-program data for TX/FL/CA.
 *
 * Mirrors the matching logic in components/providers/BenefitsDiscoveryModule.tsx
 * (regex-keyword over enriched program data — NOT the standalone /api/benefits/match
 * which uses a different table + scoring engine).
 *
 * Run: npx tsx scripts/verify-arm-b-dollar-floor.ts
 */

import { getAllProgramIds, getEnrichedProgram, getStateSlug } from "../lib/program-data";
import type { WaiverProgram } from "../data/waiver-library";

type CareNeed = "stayingAtHome" | "payingForCare" | "memoryHealth" | "companionship";

const CARE_NEEDS: CareNeed[] = [
  "payingForCare",
  "stayingAtHome",
  "memoryHealth",
  "companionship",
];

const STATES = ["TX", "FL", "CA"];

// Lifted verbatim from BenefitsDiscoveryModule.tsx:86–101
function matchesCareNeed(program: WaiverProgram, careNeed: CareNeed): boolean {
  const text = `${program.name} ${program.shortName ?? ""} ${program.tagline ?? ""}`.toLowerCase();
  switch (careNeed) {
    case "stayingAtHome":
      return /\b(home care|home.based|hcbs|community.based|in.home|attendant|adult day|waiver|personal care|daily|stay home)\b/.test(text);
    case "payingForCare":
      return /\b(medicare savings|financial|cash|premium|snap|food|ssi|pension|assistance|qmb|slmb|pharmac|low.income|groceries|pay)\b/.test(text);
    case "memoryHealth":
      return /\b(memory|alzheimer|dementia|medical|health|pace|medicaid|nursing|hospice|prescription)\b/.test(text);
    case "companionship":
      return /\b(companion|support|caregiver|respite|social)\b/.test(text);
    default:
      return true;
  }
}

// Parse "$10,000 – $30,000/year" → { lo: 10000, hi: 30000, period: 'year' }
function parseSavingsRange(range?: string): { lo: number; hi: number; period: "year" | "month" | "unknown" } | null {
  if (!range) return null;
  const matches = range.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map((m) => parseInt(m.replace(/[$,]/g, ""), 10)).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  const period = /\bmonth|mo\b/i.test(range) ? "month" : /\byear|yr|annual/i.test(range) ? "year" : "unknown";
  return {
    lo: nums[0],
    hi: nums.length > 1 ? nums[nums.length - 1] : nums[0],
    period,
  };
}

function toMonthly(amount: number, period: "year" | "month" | "unknown"): number {
  if (period === "month") return amount;
  if (period === "year") return Math.round(amount / 12);
  // Unknown period — assume year (most program data is annualized)
  return Math.round(amount / 12);
}

interface ProgramSavingsRow {
  name: string;
  savingsRange: string;
  monthlyLow: number;
  monthlyHigh: number;
}

function analyze(stateAbbrev: string, careNeed: CareNeed) {
  const stateId = getStateSlug(stateAbbrev);
  if (!stateId) return null;

  const allIds = getAllProgramIds(stateId);
  const all = allIds
    .map((id) => getEnrichedProgram(stateId, id))
    .filter((p): p is WaiverProgram => !!p);

  const matched = all
    .filter((p) => p.programType === "benefit")
    .filter((p) => matchesCareNeed(p, careNeed));

  const rows: ProgramSavingsRow[] = [];
  let totalMonthlyLow = 0;
  let totalMonthlyHigh = 0;
  let withSavingsData = 0;

  for (const p of matched) {
    const parsed = parseSavingsRange(p.savingsRange);
    if (parsed) {
      const ml = toMonthly(parsed.lo, parsed.period);
      const mh = toMonthly(parsed.hi, parsed.period);
      rows.push({
        name: p.shortName || p.name,
        savingsRange: p.savingsRange ?? "",
        monthlyLow: ml,
        monthlyHigh: mh,
      });
      totalMonthlyLow += ml;
      totalMonthlyHigh += mh;
      withSavingsData++;
    } else {
      rows.push({
        name: p.shortName || p.name,
        savingsRange: p.savingsRange ?? "(no savings data)",
        monthlyLow: 0,
        monthlyHigh: 0,
      });
    }
  }

  return {
    state: stateAbbrev,
    careNeed,
    matchedCount: matched.length,
    withSavingsCount: withSavingsData,
    totalMonthlyLow,
    totalMonthlyHigh,
    rows,
  };
}

function printReport() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("Phase 0.1 — Arm B dollar-floor verification");
  console.log("Claim under test: \"$400-$900/month often goes unclaimed.\"");
  console.log("═══════════════════════════════════════════════════════════════\n");

  for (const stateAbbrev of STATES) {
    for (const careNeed of CARE_NEEDS) {
      const result = analyze(stateAbbrev, careNeed);
      if (!result) continue;

      console.log(`\n── ${stateAbbrev} · ${careNeed} ──`);
      console.log(`Total matched: ${result.matchedCount} programs (${result.withSavingsCount} with savings data)`);

      if (result.withSavingsCount > 0) {
        console.log(`Aggregate monthly potential: $${result.totalMonthlyLow.toLocaleString()} – $${result.totalMonthlyHigh.toLocaleString()}/mo`);

        const hits400 = result.totalMonthlyHigh >= 400;
        const hits900 = result.totalMonthlyHigh >= 900;
        const indicator = hits900 ? "✓✓ exceeds $900 ceiling" : hits400 ? "✓ within $400-$900 band" : "✗ below $400 floor";
        console.log(`Verdict: ${indicator}`);
      } else {
        console.log(`Verdict: ✗ no savings data available`);
      }

      // Print top 5 rows by monthlyHigh
      const top = [...result.rows].sort((a, b) => b.monthlyHigh - a.monthlyHigh).slice(0, 5);
      for (const r of top) {
        const monthlyStr = r.monthlyHigh > 0
          ? `$${r.monthlyLow.toLocaleString()}-$${r.monthlyHigh.toLocaleString()}/mo`
          : "—";
        console.log(`  • ${r.name.padEnd(50).slice(0, 50)} ${monthlyStr.padStart(20)} (raw: ${r.savingsRange})`);
      }
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("SUMMARY — Arm B subhead validity per state × care-need combination");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Logic: aggregate monthlyHigh ≥ $400 = claim survives; ≥ $900 = claim is conservative");
  console.log();

  const summary: Array<{ state: string; careNeed: CareNeed; passed: boolean; aggregate: number }> = [];
  for (const stateAbbrev of STATES) {
    for (const careNeed of CARE_NEEDS) {
      const r = analyze(stateAbbrev, careNeed);
      if (!r) continue;
      summary.push({
        state: stateAbbrev,
        careNeed,
        passed: r.totalMonthlyHigh >= 400,
        aggregate: r.totalMonthlyHigh,
      });
    }
  }

  for (const s of summary) {
    const tag = s.aggregate >= 900 ? "✓✓" : s.aggregate >= 400 ? "✓" : "✗";
    console.log(`${tag}  ${s.state} · ${s.careNeed.padEnd(18)} agg max $${s.aggregate.toLocaleString()}/mo`);
  }

  const passed = summary.filter((s) => s.passed).length;
  const total = summary.length;
  console.log(`\nOverall: ${passed}/${total} state×care-need combinations meet the $400/mo floor.`);
  console.log();
}

printReport();
