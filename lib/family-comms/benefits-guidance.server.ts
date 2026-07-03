/**
 * Benefits guidance for the family-comms layer (the "paying for care" rung).
 *
 * Two jobs:
 *  1. getProgramsForFamily — pick a small set of real benefit programs for a
 *     family from what we already know (state, care types, any quiz facts),
 *     WITHOUT asking the family anything. State programs first, federal
 *     fallback, hard-excluding programs we can already rule out. This is the
 *     "arrive with answers, not homework" half of the guidance email.
 *  2. pickQuizQuestion — choose the ONE highest-value benefits-intake fact we
 *     don't have yet, for the in-email micro-quiz (one-tap answer chips). The
 *     quiz link cliff (~90%+ never complete a linked quiz) is why the question
 *     comes to the email instead of the email pointing at the quiz.
 *
 * See the Guidance Layer Direction doc (2026-07-03). Server-only: queries with
 * the service client passed in by the caller (crons / server routes).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BenefitProgram } from "@/lib/types/benefits";
import type { QuizQuestion } from "@/lib/claim-tokens";

export interface GuidanceProgram {
  name: string;
  /** e.g. "$1,200–$2,800/mo" — nullable free text from the program row. */
  savingsRange: string | null;
  /** One plain-language sentence, trimmed from the program description. */
  blurb: string;
  /** Best available action link: application_url > website > waiver page. */
  url: string | null;
  phone: string | null;
  /** True when the program is state-specific (vs a federal catch-all). */
  isState: boolean;
}

export interface FamilyBenefitsFacts {
  state: string | null; // 2-letter state code
  careTypes: string[];
  /** From metadata.medicaid_status or inferred from payment_methods. */
  medicaidStatus: "alreadyHas" | "applying" | "notSure" | "doesNotHave" | null;
  /** From metadata.veteran_status or inferred from payment_methods. */
  veteranStatus: "yes" | "no" | null;
  age: number | null;
}

/** Derive the benefits-relevant facts from a family profile row (top-level
 *  columns + JSONB metadata). Inference only fills gaps — an explicit stored
 *  answer always wins. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function familyBenefitsFacts(profile: { state?: string | null; care_types?: string[] | null; metadata?: any }): FamilyBenefitsFacts {
  const meta = profile.metadata || {};
  const paymentMethods: string[] = Array.isArray(meta.payment_methods) ? meta.payment_methods : [];
  const hasPayment = (needle: string) => paymentMethods.some((m) => typeof m === "string" && m.toLowerCase().includes(needle));

  let medicaidStatus: FamilyBenefitsFacts["medicaidStatus"] = null;
  if (typeof meta.medicaid_status === "string" && meta.medicaid_status) {
    medicaidStatus = meta.medicaid_status as FamilyBenefitsFacts["medicaidStatus"];
  } else if (hasPayment("medicaid")) {
    // The inquiry flow's payment-method pick is an explicit "we use Medicaid".
    medicaidStatus = "alreadyHas";
  }

  let veteranStatus: FamilyBenefitsFacts["veteranStatus"] = null;
  if (meta.veteran_status === "yes" || meta.veteran_status === "no") {
    veteranStatus = meta.veteran_status;
  } else if (hasPayment("veteran")) {
    veteranStatus = "yes";
  }

  const age = typeof meta.age === "number" && meta.age > 0 ? meta.age : null;

  return {
    state: profile.state || null,
    careTypes: Array.isArray(profile.care_types) ? profile.care_types : [],
    medicaidStatus,
    veteranStatus,
    age,
  };
}

const HOME_KEYWORDS = ["home", "hcbs", "in-home", "homemaker", "home health", "home care", "community-based", "aging in place"];
const FACILITY_KEYWORDS = ["facility", "nursing", "assisted living", "nursing home", "residential", "institutional", "skilled nursing"];

/**
 * Programs that actually PAY FOR CARE (waivers, HCBS, PACE, attendant services)
 * vs premium/prescription helpers (QMB, Extra Help) and non-care benefits. The
 * category column can't separate them — both are "healthcare" — and federal
 * premium helpers carry priority 90+ vs state waivers at ~70, so without this
 * boost a "how to pay for care" email would lead with Medicare premium help.
 */
const CARE_COST_KEYWORDS = [
  "waiver", "hcbs", "long-term care", "long term care", "pace", "personal care",
  "attendant", "in-home", "home care", "home-based", "nursing", "assisted living",
  "adult day", "respite", "community care", "community-based", "aid and attendance", "aid & attendance",
];

function paysForCare(p: BenefitProgram): boolean {
  const text = `${p.name} ${p.description || ""}`.toLowerCase();
  return CARE_COST_KEYWORDS.some((kw) => text.includes(kw));
}

function careSettingAffinity(careTypes: string[]): "home" | "facility" | null {
  const joined = careTypes.join(" ").toLowerCase().replace(/_/g, " ");
  if (!joined) return null;
  if (/home/.test(joined)) return "home";
  if (/(assisted|nursing|memory|facility|residential)/.test(joined)) return "facility";
  return null;
}

function programSetting(name: string): "home" | "facility" | "any" {
  const lower = name.toLowerCase();
  const isHome = HOME_KEYWORDS.some((kw) => lower.includes(kw));
  const isFacility = FACILITY_KEYWORDS.some((kw) => lower.includes(kw));
  if (isHome && !isFacility) return "home";
  if (isFacility && !isHome) return "facility";
  return "any";
}

function firstSentence(text: string, maxLen = 160): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  const period = clean.indexOf(". ");
  const sentence = period > 20 ? clean.slice(0, period + 1) : clean;
  return sentence.length > maxLen ? sentence.slice(0, maxLen - 1).trimEnd() + "…" : sentence;
}

/**
 * Pick up to `limit` programs the family plausibly qualifies for, from what we
 * already know. Hard-excludes only on facts we HOLD (unknowns stay in — the
 * micro-quiz narrows them later). State programs outrank federal at equal
 * priority. Returns [] only if both tables are empty/unreachable.
 */
export async function getProgramsForFamily(
  db: SupabaseClient,
  facts: FamilyBenefitsFacts,
  limit = 3,
): Promise<GuidanceProgram[]> {
  const statePromise = facts.state
    ? db.from("sbf_state_programs").select("*").eq("state_code", facts.state).eq("is_active", true).order("priority_score", { ascending: false }).limit(30)
    : Promise.resolve({ data: [], error: null });
  const federalPromise = db.from("sbf_federal_programs").select("*").eq("is_active", true).order("priority_score", { ascending: false }).limit(30);
  const [stateRes, federalRes] = await Promise.all([statePromise, federalPromise]);
  const statePrograms = ((stateRes.data as BenefitProgram[] | null) || []).map((p) => ({ p, isState: true }));
  const federalPrograms = ((federalRes.data as BenefitProgram[] | null) || []).map((p) => ({ p, isState: false }));

  const affinity = careSettingAffinity(facts.careTypes);
  const seen = new Set<string>();
  const scored: { program: BenefitProgram; isState: boolean; score: number }[] = [];

  for (const { p, isState } of [...statePrograms, ...federalPrograms]) {
    const key = p.name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    // Hard exclusions only on facts we actually hold.
    if (p.requires_veteran === true && facts.veteranStatus === "no") continue;
    if (p.requires_medicaid && facts.medicaidStatus === "doesNotHave") continue;
    if (p.min_age != null && facts.age != null && facts.age < p.min_age) continue;
    // Don't LEAD with veteran-only programs when veteran status is unknown —
    // the quiz asks; a wrong guess here reads as "they don't know us at all".
    if (p.requires_veteran === true && facts.veteranStatus !== "yes") continue;

    let score = p.priority_score + (isState ? 10 : 0);
    if (paysForCare(p)) score += 25;
    if (affinity) {
      const setting = programSetting(p.name);
      if (setting === affinity) score += 8;
      else if (setting !== "any") score -= 8;
    }
    if (p.requires_medicaid && facts.medicaidStatus === "alreadyHas") score += 6;
    scored.push({ program: p, isState, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ program, isState }) => ({
    name: program.name,
    savingsRange: program.savings_range || null,
    blurb: firstSentence(program.description),
    url: program.application_url || program.website || program.waiver_library_url || null,
    phone: program.phone || null,
    isState,
  }));
}

export interface QuizChip {
  label: string;
  answer: string;
}

export interface QuizAsk {
  question: QuizQuestion;
  /** The question line as shown in the email. */
  prompt: string;
  chips: QuizChip[];
}

/**
 * The ONE question worth asking this family next, or null when we already hold
 * all three facts (the email then closes with the full-picture link instead).
 * Priority = information value for program matching: Medicaid gates the most
 * programs, veteran status unlocks VA Aid & Attendance, age band fine-tunes.
 */
export function pickQuizQuestion(facts: FamilyBenefitsFacts): QuizAsk | null {
  if (!facts.medicaidStatus) {
    return {
      question: "medicaid",
      prompt: "Does the person needing care have Medicaid?",
      chips: [
        { label: "Yes, already have it", answer: "alreadyHas" },
        { label: "Applying / not sure", answer: "notSure" },
        { label: "No", answer: "doesNotHave" },
      ],
    };
  }
  if (!facts.veteranStatus) {
    return {
      question: "veteran",
      prompt: "Did they (or their spouse) serve in the military?",
      chips: [
        { label: "Yes", answer: "yes" },
        { label: "No", answer: "no" },
      ],
    };
  }
  if (!facts.age) {
    return {
      question: "age",
      prompt: "How old is the person needing care?",
      chips: [
        { label: "Under 65", answer: "60" },
        { label: "65–74", answer: "70" },
        { label: "75–84", answer: "80" },
        { label: "85+", answer: "87" },
      ],
    };
  }
  return null;
}
