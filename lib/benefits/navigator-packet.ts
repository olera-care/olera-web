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
 * The second finding is the reason `route: "ask"` exists at all. 63 of the
 * 130 families gave us none of the four facts, which makes `screen()` in
 * selectFirstStepProgram a no-op and leaves entry-source — the program page
 * they happened to land on — deciding their first step. A program pick for
 * those families is a guess dressed as advice, and the honest first message
 * is a question rather than a letter.
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
  /** Human-readable reasons, in the order they were evaluated. */
  holds: string[];
  models: Record<string, string>;
  /** A stage that failed. Never silently drops the letter — it holds it. */
  errors?: string[];
}

// ── Thresholds ─────────────────────────────────────────────────────────────

/**
 * Past this, a letter is a different message and someone should read it as a
 * person. Not a factual concern: the composer already handles stale intakes
 * (intakeReference says "back in June" and instructs the model to own the
 * delay), but the family's situation may have genuinely moved on.
 */
export const STALE_INTAKE_DAYS = 45;

/** A clearance older than this is re-checked before it can gate an auto-send. */
export const CLEARANCE_MAX_AGE_DAYS = 90;

// ── Gate: do we know enough to pick? ───────────────────────────────────────

export interface FactsInput {
  careTypes: string[];
  age: number | null;
  incomeBand: string | null;
  medicaidStatus: string | null;
  veteranStatus: string | null;
  /** Free-text situation the family gave us, when they gave one. */
  situation: string | null;
}

/**
 * Decide whether we hold enough to pick a program at all.
 *
 * `enoughToPick` requires at least one DIRECTIONAL fact — care types or a
 * stated situation. Screening facts (age, income, Medicaid, veteran) do not
 * satisfy it on their own: knowing a family is 74 and on Medicaid tells you
 * what they might qualify for and nothing about what they need, and picking
 * on that alone is how an 87-year-old with an immediate care need was sent
 * to a home-energy retrofit.
 */
export function readFacts(input: FactsInput): FactsRead {
  const directional: string[] = [];
  const screening: string[] = [];
  const missing: string[] = [];

  if (input.careTypes.length > 0) directional.push(`care types: ${input.careTypes.join(", ")}`);
  else missing.push("what kind of care or help they need");

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

// ── The router ─────────────────────────────────────────────────────────────

export interface RouteInput {
  facts: FactsRead;
  fit: FitRead[];
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

  const holds: string[] = [];

  if (consensus === "unread") holds.push("fit was never read");
  else if (consensus === "split") holds.push("models disagree on fit");
  else if (consensus === "questionable") {
    const q = input.fit.find((r) => r.verdict === "questionable");
    holds.push(`fit questionable: ${q?.why ?? "a better first call exists"}`);
  }

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

  if (input.intakeAgeDays != null && input.intakeAgeDays > STALE_INTAKE_DAYS) {
    holds.push(`intake was ${input.intakeAgeDays} days ago`);
  }

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
