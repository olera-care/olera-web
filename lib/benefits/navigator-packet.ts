import { AGE_BAND_LABELS, type AgeBand } from "@/lib/benefits/age";
import { isInferredCareNeed, type CareNeedSource } from "@/lib/benefits/care-need-source";
/**
 * Navigator packet — the computed verdict that decides what happens to a
 * first-step letter, replacing the human copy-paste review loop.
 *
 * Why this exists (measured 2026-08-23 against all 130 pending drafts):
 * the letters' FACTS were already healthy — snapshot drift 0, honesty-rail
 * violations 2 of 130 — while the PICKS were not: 9 letters named a program
 * the family's own stated facts rule out, and 79 more had a clearly better
 * first call available in the same state. The old review loop could not catch
 * any of that, because it asked an external model to judge fit with no family
 * context. So the packet checks FIT FIRST and treats facts as the cheap,
 * cacheable part.
 *
 * `route: "ask"` exists for families who never told us what they need, so a
 * pick would be a guess dressed as advice. That is RARE: 94% of benefits
 * completions state a need. It looks common only if you read the profile
 * row, because the need is stored on the benefits_completed seeker_activity
 * event — reading the profile alone made 92 of 129 letters appear fact-free
 * when every one of them had a stated need. Callers must supply careNeed.
 *
 * Pure module, no server or DB imports: the cron builds packets with it and
 * the admin queue re-reads the same `route`/`holds` to explain itself, so the
 * reason a letter is waiting can never drift between the two.
 */

// ── Vocabulary ─────────────────────────────────────────────────────────────

/** Where a letter goes once its packet is built. Ordered by precedence. */
export type PacketRoute =
  /** We do not know enough to pick. Send a question, not a program. */
  | "ask"
  /** The pick is ruled out by the family's own facts. Re-select, never send. */
  | "recompose"
  /** Sendable, but something wants a human read first. */
  | "review"
  /** Clean on every gate. */
  | "auto";

export type FitVerdict = "good" | "questionable" | "wrong";

/** One model's read on whether this program is the right FIRST call. */
export interface FitRead {
  model: string;
  verdict: FitVerdict;
  /** One sentence. Shown to the reviewer verbatim. */
  why: string;
  /** A better program from the same state, when the model named one. */
  better: string | null;
}

/**
 * The four Tier-1 honesty rails. These are the letter's own voice spec
 * (lib/family-comms/benefits-navigator.server.ts), not new policy — the
 * packet only re-checks what the composer was already told never to do.
 */
export type RailId = "qualify" | "speed" | "money" | "instruct";

export interface RailHit {
  rail: RailId;
  /** The offending sentence, quoted from the letter. */
  quote: string;
  why: string;
}

/**
 * What we hold about the family, split by what each kind of fact decides.
 *
 * The split is load-bearing. Directional facts decide WHICH program is
 * right; screening facts decide WHETHER they might qualify. A family can be
 * rich in one and empty in the other, and only the directional gap makes the
 * pick a coin flip — which is why `enoughToPick` keys off directional facts
 * and treats screening facts as a bonus rather than a requirement.
 */
export interface FactsRead {
  directional: string[];
  screening: string[];
  missing: string[];
  enoughToPick: boolean;
}

/** The program's standing verification record, read from cache. */
export interface ClearanceRead {
  programId: string;
  stateId: string | null;
  lastVerifiedDate: string | null;
  /** Days since lastVerifiedDate; null when never verified. */
  ageDays: number | null;
  /** HIGH findings from scripts/benefits-lint.js for this program. */
  highFindings: string[];
  /**
   * Verified recently AND carrying no HIGH lint finding. Both halves are
   * required: on 2026-08-23, 11 programs stamped verified within 30 days
   * still carried a HIGH finding, so the stamp alone is not a clean bill of
   * health — it only records that a correction round touched the program.
   */
  cleared: boolean;
}

/** A finding from scripts/benefits-draft-lint.js about this specific draft. */
export interface DraftLintHit {
  check: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

export interface NavigatorPacket {
  version: 1;
  builtAt: string;
  facts: FactsRead;
  /** One read per independent model. Disagreement is itself a hold. */
  fit: FitRead[];
  rails: RailHit[];
  clearance: ClearanceRead | null;
  lint: DraftLintHit[];
  /** Days since the family completed the benefits intake. */
  intakeAgeDays: number | null;
  /** The letter names a dollar amount. Always worth a human read. */
  statesDollarFigure: boolean;
  route: PacketRoute;
  /**
   * Where to re-select TO, when both models independently landed on the same
   * better program. Measured on the live queue: of 76 letters where both
   * named an alternative, 60 named the SAME one. That is not "this pick is
   * suboptimal", it is "send this instead" with the target supplied — so it
   * becomes a recompose instruction rather than a hold on TJ's attention.
   */
  recomposeTarget: { name: string; programId: string | null } | null;
  /**
   * The recompose is a CAVEAT rewrite, not a program switch: keep the
   * family's entry program, state the condition the fit reads flagged in one
   * plain sentence, and offer recomposeTarget as the better first call if it
   * does not apply to them. Set only alongside route "recompose". Absent on
   * packets built before 2026-09-24, which reads as a switch.
   */
  caveat?: boolean;
  /**
   * The recompose is a same-program REWRITE: the letter tells the family they
   * said they need something they never said (their need was inferred from
   * the program page). Keep the program, re-draft the text. Set only
   * alongside route "recompose".
   */
  rewrite?: boolean;
  /**
   * The family's care need was inferred (lib/benefits/care-need-source.ts),
   * decided at build time from the intake event. Absent on packets built
   * before 2026-09-24; readers then fall back to profile metadata.
   */
  needInferred?: boolean;
  /** Human-readable reasons, in the order they were evaluated. */
  holds: string[];
  models: Record<string, string>;
  /** A stage that failed. Never silently drops the letter — it holds it. */
  errors?: string[];
}

// ── Thresholds ─────────────────────────────────────────────────────────────

/**
 * Past this, an intake is old enough to be worth SEEING in the queue. It is
 * deliberately not a hold any more.
 *
 * It was one, and it was wrong twice over. The composer already owns the
 * delay (intakeReference says "back in June" and instructs the model to say
 * so), and these letters were written by a backfill built specifically to
 * reach old intakes — so holding them for being old holds them for the
 * condition they exist to address. The other half, "their situation may have
 * moved on", is real but unanswerable: a reviewer reading the letter cannot
 * tell either. A gate nobody can act on is not a gate. It blocked 100 of 129
 * letters and asked TJ to adjudicate something the letter cannot show him.
 *
 * Whether to write to months-old intakes at all is one bulk decision, made
 * once from a queue filter over `intakeAgeDays`, not 100 individual ones.
 */
export const STALE_INTAKE_DAYS = 45;

/** A clearance older than this is re-checked before it can gate an auto-send. */
export const CLEARANCE_MAX_AGE_DAYS = 90;

// ── Gate: do we know enough to pick? ───────────────────────────────────────

export interface FactsInput {
  /**
   * The need the family picked at intake ("payingForCare", "memoryHealth"…).
   * It lives on the benefits_completed seeker_activity event, NOT on the
   * profile — 94% of completions have one, and reading only the profile made
   * 92 of 129 letters look fact-free when none of them were.
   */
  careNeed: string | null;
  /**
   * Whether the family chose careNeed or a surface derived it
   * (lib/benefits/care-need-source.ts). The program-page card derives it from
   * the page, so it is not something they told us. Absent reads as stated.
   */
  careNeedSource?: CareNeedSource | null;
  /** The program page they signed up on, when they came through one. */
  entryProgram?: string | null;
  careTypes: string[];
  /** Typed exact age only. */
  age: number | null;
  /** One-tap age band ("under_65"...), when no exact age was typed. */
  ageBand?: AgeBand | null;
  incomeBand: string | null;
  medicaidStatus: string | null;
  veteranStatus: string | null;
  /** Free-text situation the family gave us, when they gave one. */
  situation: string | null;
}

/** Intake stores the need camelCased; the models should read English. */
export function humanCareNeed(raw: string): string {
  const map: Record<string, string> = {
    payingForCare: "paying for care",
    stayingAtHome: "staying at home",
    memoryHealth: "memory and health",
    companionship: "companionship",
  };
  return map[raw] ?? raw.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

/**
 * Decide whether we hold enough to pick a program at all.
 *
 * `enoughToPick` requires at least one DIRECTIONAL fact — the need they came
 * for, a care type, or a stated situation. Screening facts (age, income,
 * Medicaid, veteran) do not satisfy it: knowing a family is 74 and on
 * Medicaid tells you what they might qualify for and nothing about what they
 * need, and picking on that alone is how an 87-year-old with an immediate
 * care need was sent to a home-energy retrofit.
 */
export function readFacts(input: FactsInput): FactsRead {
  const directional: string[] = [];
  const screening: string[] = [];
  const missing: string[] = [];

  // An inferred need still counts as a directional fact, so routing does not
  // change (these families came for a specific program, which IS direction).
  // What changes is the wording: the fit models must read it as the page they
  // came through, not as a need the family stated.
  const inferred = !!input.careNeed && isInferredCareNeed(input.careNeedSource);
  if (input.careNeed && !inferred) {
    directional.push(`what they came for: ${humanCareNeed(input.careNeed)}`);
  } else if (inferred && input.entryProgram) {
    directional.push(
      `what they came for: the ${input.entryProgram} program page (they did not tell us what kind of help they need)`,
    );
  } else if (inferred) {
    directional.push(
      `what they came for: not stated (${input.careNeedSource === "inferred_from_question" ? "their question" : "the page they signed up on"} suggests ${humanCareNeed(input.careNeed!)})`,
    );
  }
  if (input.careTypes.length > 0) directional.push(`care types: ${input.careTypes.join(", ")}`);
  if ((!input.careNeed || inferred) && input.careTypes.length === 0) {
    missing.push("what kind of care or help they need");
  }

  if (input.situation?.trim()) directional.push("described their situation");

  if (input.age != null) screening.push(`age ${input.age}`);
  else if (input.ageBand) screening.push(`age band: ${AGE_BAND_LABELS[input.ageBand]}`);
  else missing.push("the age of the person needing care");

  if (input.medicaidStatus) screening.push(`Medicaid: ${input.medicaidStatus}`);
  else missing.push("whether they are on Medicaid");

  if (input.incomeBand) screening.push(`income band: ${input.incomeBand}`);
  else missing.push("a rough monthly income range");

  if (input.veteranStatus) screening.push(`veteran: ${input.veteranStatus}`);

  return { directional, screening, missing, enoughToPick: directional.length > 0 };
}

// ── Gate: fit consensus ────────────────────────────────────────────────────

export type FitConsensus = FitVerdict | "split" | "unread";

/**
 * Collapse independent fit reads into one verdict.
 *
 * Deliberately pessimistic, and never a majority vote. One model saying the
 * family's own facts rule this program out is enough to stop the send, because
 * the cost of that call being right is a family spending their one attempt on
 * a program that cannot help them. `split` exists so genuine disagreement
 * surfaces to a human instead of being averaged away — at $0.003 a read, two
 * independent judgments on the question that decides whether a letter helps
 * someone is the cheapest signal in the system.
 */
export function fitConsensus(reads: FitRead[]): FitConsensus {
  if (reads.length === 0) return "unread";
  const verdicts = new Set(reads.map((r) => r.verdict));

  // A lone "wrong" standing against a "good" is not a verdict, it is an
  // argument — and throwing the letter away on it discards the other model's
  // opposite conclusion without anyone reading either. Measured on a live
  // sample of 14 dual-read letters: 11 agreed exactly, 2 split only on degree
  // (questionable vs wrong), and 1 was a true good-vs-wrong. That last shape
  // is the only one worth a person's time, and it is rare enough to afford.
  if (verdicts.has("wrong")) {
    return verdicts.has("good") ? "split" : "wrong";
  }

  if (verdicts.size > 1) return "split";
  return reads[0].verdict;
}

/**
 * The alternative both models independently named, or null.
 *
 * Requires every read to name one and all of them to agree. Matching is
 * normalised and allows containment ("Community Choices" vs "Community
 * Choices Waiver"), with a length floor so a short string cannot swallow an
 * unrelated longer one — "care" must not match "Community Care Waiver".
 */
export function agreedBetterProgram(reads: FitRead[]): string | null {
  if (reads.length < 2) return null;
  const names = reads.map((r) => r.better).filter((b): b is string => !!b && b.trim().length > 0);
  if (names.length !== reads.length) return null;

  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const [first, ...rest] = names.map(norm);
  if (first.length < 6) return null;
  const allAgree = rest.every(
    (n) => n === first || (n.length >= 6 && (n.includes(first) || first.includes(n))),
  );
  // Return the longest original spelling — it is the most resolvable.
  return allAgree ? names.slice().sort((a, b) => b.length - a.length)[0] : null;
}

// ── Eligibility gates in fit reasons ───────────────────────────────────────

/**
 * Phrases that name WHO CAN GET a program: a condition a family either meets
 * or does not. A "questionable" read that names one is a real caveat the
 * model could not call "wrong" only because the deciding fact is unknown
 * (Oregon ERA serves unstably housed seniors; FL SMMC-LTC needs nursing-
 * facility level of care).
 *
 * Most questionable reads are about FIT instead ("doesn't address paying for
 * care", "not the strongest first call"). Those carry no condition, and
 * forcing the composer to write "This program is for ..." from them produced
 * odd or invented condition sentences (pre-test, 2026-09-24). So only these
 * reasons open the caveat path, and only these reach the composer.
 *
 * Deliberately a phrase list, not a model: deterministic, free, and pinned by
 * scripts/check-navigator-route.ts. Income and asset limits are left out on
 * purpose: nearly every program has one and it is never known at this stage,
 * so naming it would caveat every letter and tell the family nothing.
 */
const ELIGIBILITY_GATE_PATTERNS: RegExp[] = [
  // Housing status
  /\bhomeless/i,
  /\b(unstabl[ey]|insecurely)\s+housed\b/i,
  /\bhousing (instability|insecurity|crisis)\b/i,
  /\bat risk of (homelessness|eviction)\b/i,
  // Homebound / level of care / functional need
  /\bhomebound\b/i,
  /\bnursing[- ](facility|home)[- ]level\b/i,
  /\blevel[- ]of[- ]care\b/i,
  /\bLOC\b/,
  /\binstitutional level\b/i,
  /\bfunctional(ly)? (eligib|assessment|need|criteria)/i,
  /\b(ADLs?|activities of daily living)\b/i,
  // Disability
  /\bdisabilit(y|ies)\b/i,
  /\bdisabled\b/i,
  /\bblind(ness)?\b/i,
  /\bSSI\b|\bSSDI\b/,
  // Age thresholds
  /\b(5[5-9]|[6-9]\d)\s*(\+|or older|and older|or over|and over)/i,
  /\bunder (age )?\d{2}\b/i,
  /\bage[- ](threshold|requirement|gate|limit|minimum|cutoff|cut-off)/i,
  /\bminimum age\b/i,
  /\bage\s*\/\s*(LOC|level)/i,
  /\ball[- ]household\b/i,
  // Income source, residency, citizenship
  /\bno earned income\b/i,
  /\bresiden(cy|t) requirement/i,
  /\bcitizenship\b|\bimmigration status\b|\blawful(ly)? (present|permanent)\b|\bqualified non-?citizen/i,
  // Medicaid as a precondition
  // ("Medicaid-enrolled older adult" is a fact about the family, not a gate.)
  /\b(requires?|required|must (already )?(be on|have)|only for (people|those|members) (on|with)) (full )?Medicaid\b/i,
  /\b(requires?|needs?|plus) Medicaid[- ]eligibility\b|\bMedicaid[- ]eligibility (is )?(required|requirement)/i,
  // Property
  /\bhomeowner(s|ship)?\b/i,
  // Service history, diagnosis, prognosis
  /\b(wartime|military) service\b|\bveterans? only\b/i,
  /\bdiagnos(is|ed) (of|with)\b/i,
  /\b(terminal|hospice[- ]eligible|life expectancy)\b/i,
];

/** Does this fit reason name a real eligibility gate (who can get it)? */
export function namesEligibilityGate(why: string | null | undefined): boolean {
  if (!why) return false;
  // Program NAMES carry gate words ("Elderly & Disabled Waiver", "Aged, Blind
  // and Disabled Medicaid"). A reason that only names the alternative is
  // not stating a condition on the pick, so strip names before matching.
  const text = why.replace(
    /\b(elderly|aged)\s*(&|and|,|-)?\s*(blind\s*(&|and|,|-)?\s*)?disabled\b|\baged[- ]blind[- ]disabled\b/gi,
    "",
  );
  return ELIGIBILITY_GATE_PATTERNS.some((re) => re.test(text));
}

/** The questionable reads' reasons that name an eligibility gate, deduped. */
export function eligibilityGateReasons(reads: FitRead[]): string[] {
  return Array.from(
    new Set(
      reads
        .filter((r) => r.verdict === "questionable")
        .map((r) => r.why.trim())
        .filter((w) => w.length > 0 && namesEligibilityGate(w)),
    ),
  );
}

// ── The router ─────────────────────────────────────────────────────────────

export interface RouteInput {
  facts: FactsRead;
  fit: FitRead[];
  /** Resolved alternative from agreedBetterProgram, when there is one. */
  recomposeTarget?: { name: string; programId: string | null } | null;
  /** The pick is the program page the family arrived through. The program
   *  they came for leads unless ruled out (TJ, 2026-09-24), so a
   *  "questionable" read with an agreed alternative does not move it. */
  pickIsEntry?: boolean;
  /** The letter already carries the caveat rewrite (metadata
   *  caveat_applied_at). The caveat happens once; after it, the same
   *  questionable read falls through to the normal holds. */
  caveatApplied?: boolean;
  /** The family's need was inferred AND the letter says they stated one
   *  (claimsStatedNeed). The text is false, so it is rewritten, never sent. */
  claimsUnstatedNeed?: boolean;
  /** The stored fit reads were made under the pre-2026-09-24 prompt, which
   *  told the models an inferred need was what the family said. Such a read
   *  may not switch or rule out the program (see staleFitRewrite). Only a
   *  reader re-routing an old packet sets it; a fresh build never does. */
  fitReadOnInventedNeed?: boolean;
  rails: RailHit[];
  clearance: ClearanceRead | null;
  lint: DraftLintHit[];
  intakeAgeDays: number | null;
  statesDollarFigure: boolean;
  errors?: string[];
}

/**
 * Decide the route from the gate results. Pure and deterministic — the same
 * packet always routes the same way, so a letter's fate never depends on
 * which surface asked.
 *
 * Precedence is ask → recompose → review → auto, and it is not arbitrary:
 * "we do not know enough" outranks "the pick is wrong" because when we hold
 * no directional facts the pick was never a judgment we were entitled to
 * make, and recomposing would just produce a second guess.
 *
 * Everything unresolved fails toward `review`, never toward `auto`. A stage
 * that errored, a fit read that never ran, a clearance we could not load —
 * all of them hold the letter for a person rather than letting silence read
 * as approval.
 */
/** Prefix on the hold that marks a caveat recompose. Display code keys off it. */
export const CAVEAT_HOLD_PREFIX = "caveat:";
/** Prefix on the hold that marks a same-program rewrite recompose. */
export const REWRITE_HOLD_PREFIX = "rewrite:";

/**
 * Does the letter tell the family they SAID they need something? Checked only
 * when their need was inferred, where any such sentence is false. Measured on
 * 2026-09-24: 37 of 40 pending entry letters with a questionable read carried
 * "You said you need help paying for care" or a variant of it.
 */
export function claimsStatedNeed(text: string | null | undefined): boolean {
  if (!text) return false;
  return (
    /\b(you|they)\s+(also\s+)?(said|told us|mentioned|shared|let us know)\b[^.?!]{0,60}\b(need|looking for|want)/i.test(text) ||
    /\byou(?:'re| are)\s+(also\s+)?looking for help (paying for care|staying at home|with memory|with companionship)/i.test(text)
  );
}

export function routePacket(input: RouteInput): {
  route: PacketRoute;
  holds: string[];
  caveat?: true;
  rewrite?: true;
} {
  if (!input.facts.enoughToPick) {
    return {
      route: "ask",
      holds: [`no directional facts — ${input.facts.missing.join("; ")}`],
    };
  }

  const consensus = fitConsensus(input.fit);

  // A fit read made against a need the family never stated cannot move them
  // off their program. Re-draft the same program instead; the rebuilt packet
  // re-reads fit under the corrected prompt, and a switch that is still
  // warranted happens then, on honest reads.
  const staleFitRewrite = {
    route: "recompose" as const,
    holds: [`${REWRITE_HOLD_PREFIX} fit was judged against a need they never stated`],
    rewrite: true as const,
  };

  if (consensus === "wrong") {
    if (input.fitReadOnInventedNeed) return staleFitRewrite;
    const first = input.fit.find((r) => r.verdict === "wrong");
    return { route: "recompose", holds: [`pick ruled out: ${first?.why ?? "fit verdict wrong"}`] };
  }

  // Both models named the same better program. The action is to re-select,
  // not to wait for a human — nobody reading this letter can produce a
  // better answer than two independent reads that already converged.
  //
  // Except for the program the family came for. "Questionable" means it
  // helps but is not the strongest first call, and TJ's rule (2026-09-24) is
  // that the program they came for leads unless their facts rule it out.
  // Only a "wrong" verdict (above) moves it.
  //
  // But a questionable read is often a real eligibility gate the model could
  // not mark "wrong" because the deciding fact is unknown ("only serves
  // seniors who are homeless or unstably housed", "needs nursing-facility
  // level of care"). Sending the entry letter bare would hide that. So the
  // letter is rewritten ONCE with the caveat: keep their program, say who it
  // is for, and name the agreed alternative as the better first call if that
  // is not them. No person reviews it; after the rewrite the same read falls
  // through to the normal holds below.
  //
  // Only when a reason names a real eligibility gate (namesEligibilityGate).
  // A reason about fit ("doesn't address paying for care") has no condition
  // to state, so the entry letter falls straight through: the program they
  // came for leads.
  if (consensus === "questionable" && input.recomposeTarget) {
    if (!input.pickIsEntry) {
      if (input.fitReadOnInventedNeed) return staleFitRewrite;
      return {
        route: "recompose",
        holds: [`both models would start with ${input.recomposeTarget.name} instead`],
      };
    }
    if (!input.caveatApplied && eligibilityGateReasons(input.fit).length > 0) {
      return {
        route: "recompose",
        holds: [
          `${CAVEAT_HOLD_PREFIX} keep their program, state the condition, offer ${input.recomposeTarget.name}`,
        ],
        caveat: true,
      };
    }
  }

  // The letter says "you told us you need help paying for care" to a family
  // who told us nothing of the kind: the program-page card derives the need
  // from the page (lib/benefits/care-need-source.ts). Every letter composed
  // before 2026-09-24 for a program-page family says it. That sentence is
  // false, so the letter is re-drafted on the same program by the fixed
  // composer, never sent and never parked for a person.
  if (input.claimsUnstatedNeed) {
    return {
      route: "recompose",
      holds: [`${REWRITE_HOLD_PREFIX} the letter says they told us a need they never stated`],
      rewrite: true,
    };
  }

  const holds: string[] = [];

  if (consensus === "unread") holds.push("fit was never read");
  else if (consensus === "split") holds.push("models disagree on fit");
  // A bare "questionable" no longer holds. It means the program helps this
  // family but is not the strongest first call, and when the models cannot
  // converge on what IS stronger, a human reading the letter cannot either.
  // Against a family who has received nothing for 69 days, real help that is
  // not optimal beats another week of silence.

  for (const hit of input.rails) {
    holds.push(`${hit.rail} rail: "${hit.quote}"`);
  }

  if (!input.clearance) {
    holds.push("no clearance record for this program");
  } else if (input.clearance.highFindings.length > 0) {
    holds.push(`program lint HIGH: ${input.clearance.highFindings.join(", ")}`);
  } else if (input.clearance.ageDays == null) {
    holds.push("program never verified");
  } else if (input.clearance.ageDays > CLEARANCE_MAX_AGE_DAYS) {
    holds.push(`program verified ${input.clearance.ageDays}d ago`);
  }

  for (const hit of input.lint.filter((l) => l.severity === "high")) {
    holds.push(`draft lint ${hit.check}: ${hit.detail}`);
  }

  if (input.statesDollarFigure) holds.push("letter states a dollar figure");

  if (input.errors?.length) holds.push(...input.errors.map((e) => `stage failed: ${e}`));

  return { route: holds.length > 0 ? "review" : "auto", holds };
}

/**
 * Re-decide a STORED packet's route under the current rules, from the gate
 * results it already holds. No model call: routing is a pure function of the
 * gates, so this costs nothing and cannot vary.
 *
 * Why: packets rebuild only when the letter changes, never on a clock. So a
 * routing-rule change (the entry program leads, 2026-09-24; the caveat path,
 * same day) would otherwise never reach letters already judged. Measured on
 * the live queue that day: all 35 entry letters with a questionable read and
 * an agreed alternative carried the OLD verdict, a switch recompose, and the
 * autopilot would have moved every one of them off the program the family
 * came for. Returns the packet unchanged when the route and holds agree.
 */
export function rerouteStoredPacket(
  packet: NavigatorPacket,
  opts: {
    pickIsEntry: boolean;
    caveatApplied: boolean;
    claimsUnstatedNeed?: boolean;
    fitReadOnInventedNeed?: boolean;
  },
): NavigatorPacket {
  if (!packet || !packet.facts || !Array.isArray(packet.fit)) return packet;
  const r = routePacket({
    facts: packet.facts,
    fit: packet.fit,
    recomposeTarget: packet.recomposeTarget ?? null,
    pickIsEntry: opts.pickIsEntry,
    caveatApplied: opts.caveatApplied,
    claimsUnstatedNeed: !!opts.claimsUnstatedNeed,
    fitReadOnInventedNeed: !!opts.fitReadOnInventedNeed,
    rails: packet.rails ?? [],
    clearance: packet.clearance ?? null,
    lint: packet.lint ?? [],
    intakeAgeDays: packet.intakeAgeDays ?? null,
    statesDollarFigure: !!packet.statesDollarFigure,
    errors: packet.errors,
  });
  const same =
    r.route === packet.route &&
    !!r.caveat === !!packet.caveat &&
    !!r.rewrite === !!packet.rewrite &&
    r.holds.length === (packet.holds ?? []).length &&
    r.holds.every((h, i) => h === packet.holds[i]);
  if (same) return packet;
  const { caveat: _drop, rewrite: _dropRewrite, ...rest } = packet;
  void _drop;
  void _dropRewrite;
  return {
    ...rest,
    route: r.route,
    holds: r.holds,
    ...(r.caveat ? { caveat: true } : {}),
    ...(r.rewrite ? { rewrite: true } : {}),
  };
}

/** Does the letter name a dollar amount? Cheap pre-check for the money rail. */
export function statesDollarFigure(text: string): boolean {
  return /\$\s?[0-9]/.test(text);
}

// ── Staleness ──────────────────────────────────────────────────────────────

/**
 * Does this letter need a packet built (or rebuilt)?
 *
 * A packet is a verdict on a specific piece of text. Edit the letter, or
 * recompose it, and the verdict no longer describes what would send — so the
 * trigger is the letter changing, not the clock. Time alone is deliberately
 * NOT a trigger: fit verdicts vary run to run, so a nightly rebuild would
 * quietly reroute letters nobody touched, and a family's fate would depend on
 * which night the cron happened to catch them.
 */
export function packetNeedsBuild(nav: {
  packet?: { builtAt?: string } | null;
  edited_at?: string;
  recomposed_at?: string;
  composed_at?: string;
}): boolean {
  const builtAt = nav.packet?.builtAt;
  if (!builtAt) return true;
  const newest = [nav.edited_at, nav.recomposed_at, nav.composed_at]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .sort()
    .pop();
  return !!newest && newest > builtAt;
}

// ── Display ────────────────────────────────────────────────────────────────

export const ROUTE_LABEL: Record<PacketRoute, string> = {
  ask: "Ask first",
  recompose: "Recompose",
  review: "Needs your read",
  auto: "Ready to send",
};

/** Is this a caveat recompose (keep the program, add the condition)? */
export function isCaveatPacket(packet: Pick<NavigatorPacket, "route" | "holds" | "caveat">): boolean {
  return (
    packet.route === "recompose" &&
    (packet.caveat === true || !!packet.holds[0]?.startsWith(CAVEAT_HOLD_PREFIX))
  );
}

/** Is this a same-program rewrite (the text claims a need they never stated)? */
export function isRewritePacket(packet: Pick<NavigatorPacket, "route" | "holds" | "rewrite">): boolean {
  return (
    packet.route === "recompose" &&
    (packet.rewrite === true || !!packet.holds[0]?.startsWith(REWRITE_HOLD_PREFIX))
  );
}

/**
 * A recompose that keeps the current program (caveat or rewrite), as opposed
 * to one that excludes it and picks another.
 */
export function recomposeKeepsProgram(
  packet: Pick<NavigatorPacket, "route" | "holds" | "caveat" | "rewrite">,
): boolean {
  return isCaveatPacket(packet) || isRewritePacket(packet);
}

/**
 * Readable form of a hold for the admin queue. The caveat hold is a machine
 * instruction; a reviewer should read what it does.
 */
export function holdLabel(hold: string): string {
  if (hold.startsWith(CAVEAT_HOLD_PREFIX)) return "Kept their program, added the condition";
  if (hold.startsWith(REWRITE_HOLD_PREFIX)) {
    return hold.includes("fit was judged")
      ? "Checked against a need they never stated; re-drafting the same program to re-check"
      : "Letter says they told us a need they never stated; re-drafting the same program";
  }
  return hold;
}

/** Chip label for a caveat recompose, in place of "Recompose". */
export const CAVEAT_ROUTE_LABEL = "Adding condition";

/**
 * One line explaining the route, for the queue row. The holds carry the
 * detail; this is what a reviewer reads before deciding to open anything.
 */
export function routeSummary(packet: NavigatorPacket): string {
  switch (packet.route) {
    case "ask":
      return "We do not know what they need. Ask before picking a program.";
    case "recompose":
      if (isCaveatPacket(packet)) {
        return packet.recomposeTarget
          ? `Kept their program, adding the condition and ${packet.recomposeTarget.name} as the other call`
          : "Kept their program, adding the condition";
      }
      if (isRewritePacket(packet)) {
        return packet.holds[0]?.includes("fit was judged")
          ? "Same program, re-drafting: its fit was checked against a need they never stated"
          : "Same program, re-drafting: the letter claims a need they never stated";
      }
      return packet.holds[0] ?? "The pick is ruled out by their own facts.";
    case "review":
      return packet.holds.length === 1
        ? packet.holds[0]
        : `${packet.holds.length} things to check`;
    case "auto":
      return "Clean on fit, rails, clearance and lint.";
  }
}
