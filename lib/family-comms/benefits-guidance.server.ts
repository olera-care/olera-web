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
  /** Program row id — used to build the program-brief link. */
  id: string;
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

/**
 * The three financial paths (Orientation revision, 2026-07-03). The playbook
 * differs by path, so this ONE self-identified fact filters everything
 * downstream: which programs the email shows, which briefs render, what the
 * path page narrates. Never derived from a dollar amount — the family
 * self-sorts with one tap; we never ask for a budget (P3 stays dropped).
 *   a = private pay works (higher resources)
 *   b = the middle (some savings, not endless — the modal family)
 *   c = Medicaid now (very limited resources)
 */
export type FinancialPath = "a" | "b" | "c";

export interface FamilyBenefitsFacts {
  state: string | null; // 2-letter state code
  careTypes: string[];
  /** Self-sorted path from metadata.financial_path (the orientation fact). */
  financialPath: FinancialPath | null;
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

  // Medicaid already on board implies path C even if the self-sort never ran.
  let financialPath: FinancialPath | null = null;
  if (meta.financial_path === "a" || meta.financial_path === "b" || meta.financial_path === "c") {
    financialPath = meta.financial_path;
  } else if (medicaidStatus === "alreadyHas") {
    financialPath = "c";
  }

  return {
    state: profile.state || null,
    careTypes: Array.isArray(profile.care_types) ? profile.care_types : [],
    financialPath,
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
  // Ombudsman programs are advocacy, not payers — they match "long-term care"
  // but shouldn't ride the care-cost boost into the top slots.
  if (/ombudsman/i.test(p.name)) return false;
  const text = `${p.name} ${p.description || ""}`.toLowerCase();
  return CARE_COST_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * Medicaid-gated by column OR by name. The seed data under-sets
 * requires_medicaid (Texas STAR+PLUS Waiver carries requires_medicaid=false),
 * so path filtering can't trust the column alone. NAME only, never the
 * description — non-Medicaid programs routinely mention Medicaid in prose
 * ("for Texans who don't qualify for Medicaid").
 */
function isMedicaidGated(p: BenefitProgram): boolean {
  return p.requires_medicaid || /\bmedicaid\b|\bwaiver\b/i.test(p.name);
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
    // Path-aware exclusions (the orientation fix for "the same email is three
    // different lies"): a private-pay family (path A) never sees Medicaid-gated
    // waivers or hard-income-gated programs — those are false hope, not help.
    // The middle (path B) skips Medicaid-gated programs too UNLESS Medicaid is
    // already on board; the bridge programs and VA are their real levers.
    if (facts.financialPath === "a" && (isMedicaidGated(p) || p.max_income_single != null)) continue;
    if (facts.financialPath === "b" && isMedicaidGated(p) && facts.medicaidStatus !== "alreadyHas") continue;

    let score = p.priority_score + (isState ? 10 : 0);
    if (paysForCare(p)) score += 25;
    if (affinity) {
      const setting = programSetting(p.name);
      if (setting === affinity) score += 8;
      else if (setting !== "any") score -= 8;
    }
    if (isMedicaidGated(p) && facts.medicaidStatus === "alreadyHas") score += 6;
    if (facts.financialPath === "c" && isMedicaidGated(p)) score += 8;
    scored.push({ program: p, isState, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ program, isState }) => ({
    id: program.id,
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
 * everything useful (the email then closes with the full-picture link instead).
 *
 * The self-sort comes FIRST (Orientation revision): "which sounds most like
 * your situation" orients the family onto a financial path before any
 * paperwork question, and the path filters every program they see afterward.
 * Then, by information value within the path: Medicaid gates the most programs
 * (skipped for path A, where it gates nothing they'll see), veteran status
 * unlocks VA Aid & Attendance for every path, age band fine-tunes.
 */
export function pickQuizQuestion(facts: FamilyBenefitsFacts): QuizAsk | null {
  if (!facts.financialPath) {
    return {
      question: "path",
      prompt: "Which sounds most like your situation?",
      chips: [
        { label: "We can cover it comfortably", answer: "a" },
        { label: "Some savings, but not endless", answer: "b" },
        { label: "Resources are very limited", answer: "c" },
      ],
    };
  }
  if (!facts.medicaidStatus && facts.financialPath !== "a") {
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

// ── Path narratives (the orientation payoff) ────────────────────────────────

export interface PathStep {
  title: string;
  body: string;
  linkLabel: string;
  linkHref: string;
}

export interface PathNarrative {
  path: FinancialPath;
  /** e.g. "Paying privately, wisely" */
  title: string;
  /** One-sentence orientation: how families in this situation make it work. */
  intro: string;
  steps: PathStep[];
}

/**
 * The three playbooks, written once, personalized programmatically. Every step
 * links an asset that already exists — orientation is sequencing, not
 * authoring. Educational, never prescriptive: the estate-planning territory
 * says "here's the landscape and when a specialist matters," not "do this."
 */
export function getPathNarrative(path: FinancialPath, careLabel?: string | null, stateName?: string | null): PathNarrative {
  const care = careLabel || "care";
  const region = stateName || "your state";
  if (path === "a") {
    return {
      path,
      title: "Paying privately, on your terms",
      intro: `When the resources are there, the job shifts from finding money to spending it well. Here's how families in your situation usually approach ${care}.`,
      steps: [
        {
          title: "Compare before you commit",
          body: `Prices for ${care} vary widely between providers in the same area, and the most expensive option is often not the best fit. Comparing two or three seriously is the single highest-leverage hour you can spend.`,
          linkLabel: "Compare providers near you",
          linkHref: "/browse",
        },
        {
          title: "Claim what you're owed anyway",
          body: "Two things families with means routinely leave on the table: VA Aid and Attendance is not as income-restricted as people assume for wartime veterans and surviving spouses, and a large share of care costs can qualify as a medical-expense tax deduction.",
          linkLabel: "Check what applies to you",
          linkHref: "/benefits/finder",
        },
        {
          title: "Plan for the long run",
          body: "Care needs tend to grow. If the timeline could stretch to years, an hour with an elder-law or financial planner about long-term-care insurance claims and asset planning is worth it early, not late.",
          linkLabel: "Browse planning guides",
          linkHref: "/caregiver-support",
        },
      ],
    };
  }
  if (path === "b") {
    return {
      path,
      title: "The bridge plan",
      intro: `Most families are exactly here: too many resources to qualify for help today, not enough to pay forever. There's a well-worn path through it. Here's how families in your situation usually make ${care} work.`,
      steps: [
        {
          title: "Protect what you can, early",
          body: "Medicaid looks back five years at financial transfers, so the planning you do now decides your options later. Understanding the look-back rule (and when a Miller trust or an elder-law attorney matters) is step one, and it costs nothing to learn.",
          linkLabel: "The 5-year look-back, explained",
          linkHref: "/caregiver-support/medicaid-5-year-look-back-rule",
        },
        {
          title: "Bridge the cost now",
          body: `While you're not Medicaid-eligible, other help exists: state programs in ${region} that don't require Medicaid, VA Aid and Attendance for veteran families, and the spend-down math that tells you where you actually stand.`,
          linkLabel: "Run the spend-down calculator",
          linkHref: "/benefits/spend-down-calculator",
        },
        {
          title: "Line up Medicaid for later",
          body: `If care lasts years, Medicaid is how most middle-resource families eventually sustain it. Knowing ${region}'s waiver programs now means no scramble later.`,
          linkLabel: "See your state's programs",
          linkHref: "/benefits/finder",
        },
      ],
    };
  }
  return {
    path: "c",
    title: "Help exists, and you likely qualify",
    intro: `Programs for ${care} are strongest for families in exactly your situation. Here's the short version of how to put them to work.`,
    steps: [
      {
        title: "See what you qualify for",
        body: `Medicaid waivers and state programs in ${region} can cover most or all of the cost of ${care}. The matching takes about two minutes with what you've already told us.`,
        linkLabel: "See your programs",
        linkHref: "/benefits/finder",
      },
      {
        title: "Make one phone call",
        body: "Your local Area Agency on Aging is the free front door to nearly every program: one call, and a real person helps you apply. We'll give you the number and what to say.",
        linkLabel: "Find your agency",
        linkHref: "/benefits/finder",
      },
      {
        title: "Keep the care search moving",
        body: "Waitlists are real for some programs, so it pays to line up providers in parallel rather than after. Reaching out costs nothing and holds your place.",
        linkLabel: "Compare providers near you",
        linkHref: "/browse",
      },
    ],
  };
}
