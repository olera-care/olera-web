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
  careTypes: string[];
  age: number | null;
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

  if (input.careNeed) directional.push(`what they came for: ${humanCareNeed(input.careNeed)}`);
  if (input.careTypes.length > 0) directional.push(`care types: ${input.careTypes.join(", ")}`);
  if (!input.careNeed && input.careTypes.length === 0) {
    missing.push("what kind of care or help they need");
  }

  if (input.situation?.trim()) directional.push("described their situation");

  if (input.age != null) screening.push(`age ${input.age}`);
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

// ── The router ─────────────────────────────────────────────────────────────

export interface RouteInput {
  facts: FactsRead;
  fit: FitRead[];
  /** Resolved alternative from agreedBetterProgram, when there is one. */
  recomposeTarget?: { name: string; programId: string | null } | null;
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
export function routePacket(input: RouteInput): { route: PacketRoute; holds: string[] } {
  if (!input.facts.enoughToPick) {
    return {
      route: "ask",
      holds: [`no directional facts — ${input.facts.missing.join("; ")}`],
    };
  }

  const consensus = fitConsensus(input.fit);
  if (consensus === "wrong") {
    const first = input.fit.find((r) => r.verdict === "wrong");
    return { route: "recompose", holds: [`pick ruled out: ${first?.why ?? "fit verdict wrong"}`] };
  }

  // Both models named the same better program. The action is to re-select,
  // not to wait for a human — nobody reading this letter can produce a
  // better answer than two independent reads that already converged.
  if (consensus === "questionable" && input.recomposeTarget) {
    return {
      route: "recompose",
      holds: [`both models would start with ${input.recomposeTarget.name} instead`],
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

/**
 * One line explaining the route, for the queue row. The holds carry the
 * detail; this is what a reviewer reads before deciding to open anything.
 */
export function routeSummary(packet: NavigatorPacket): string {
  switch (packet.route) {
    case "ask":
      return "We do not know what they need. Ask before picking a program.";
    case "recompose":
      return packet.holds[0] ?? "The pick is ruled out by their own facts.";
    case "review":
      return packet.holds.length === 1
        ? packet.holds[0]
        : `${packet.holds.length} things to check`;
    case "auto":
      return "Clean on fit, rails, clearance and lint.";
  }
}
