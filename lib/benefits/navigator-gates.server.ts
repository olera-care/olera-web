import Anthropic from "@anthropic-ai/sdk";
import { pipelineDrafts } from "@/data/pipeline-drafts";
import type { PipelineDraft } from "@/data/pipeline-drafts-types";
import { getStateAbbrev } from "@/lib/program-data";
import {
  readFacts,
  statesDollarFigure,
  type ClearanceRead,
  type FactsInput,
  type FactsRead,
  type FitRead,
  type FitVerdict,
  type RailHit,
  type RailId,
} from "./navigator-packet";

/**
 * The model-backed gates behind a navigator packet.
 *
 * Two rules shape everything here:
 *
 * 1. **Fit is judged by more than one model, and disagreement is the signal.**
 *    The reads cost $0.003 (gpt-5.6-terra) and $0.014 (Opus) per letter, so
 *    there is no reason to choose. Crucially they are judging, not retrieving:
 *    three models pointed at the same web index produce correlated errors and
 *    a voting illusion — which is exactly how the hallucinated Colorado
 *    "Older Coloradans Cash Fund" got corroborated by aggregators echoing each
 *    other. A judgment question over facts we already hold does not have that
 *    failure mode.
 *
 * 2. **Every gate fails toward a human, never toward a send.** A missing API
 *    key, a refusal, unparseable JSON — each returns empty and the router
 *    turns that into a hold. Silence must never read as approval.
 */

const FIT_MODEL_ANTHROPIC = "claude-opus-5";
const FIT_MODEL_OPENAI = "gpt-5.6-terra";
const RAIL_MODEL = "claude-sonnet-5";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const PACKET_MODELS = {
  fitPrimary: FIT_MODEL_OPENAI,
  fitSecond: FIT_MODEL_ANTHROPIC,
  rails: RAIL_MODEL,
} as const;

function anthropic(): Anthropic {
  return new Anthropic();
}

/**
 * Extract the first balanced JSON object from a model response.
 *
 * Same lesson as lib/family-answers/engine.server.ts: models reliably emit the
 * requested object and then sometimes append prose, so parsing the whole
 * string fails on a response that was actually correct. Tracks string state so
 * a brace inside a quoted value cannot end the object early.
 */
function firstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return raw.slice(start, i + 1); }
  }
  return null;
}

function parseJson<T>(raw: string): T | null {
  const slice = firstJsonObject(raw);
  if (!slice) return null;
  try {
    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
}

// ── Gate 1: facts ──────────────────────────────────────────────────────────

/** Adapt a loaded family profile row into the facts gate's input. */
export function factsFromProfile(profile: {
  care_types?: string[] | null;
  metadata?: Record<string, unknown> | null;
  /** From the benefits_completed intake event — see FactsInput.careNeed. */
  careNeed?: string | null;
}): FactsRead {
  const meta = (profile.metadata ?? {}) as Record<string, unknown>;
  const situationParts = [meta.benefits_situation, meta.situation, meta.care_context]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  const input: FactsInput = {
    careNeed: profile.careNeed ?? null,
    careTypes: Array.isArray(profile.care_types) ? profile.care_types.filter(Boolean) : [],
    age: typeof meta.age === "number" && meta.age > 0 ? meta.age : null,
    incomeBand: typeof meta.income_range === "string" && meta.income_range ? meta.income_range : null,
    medicaidStatus:
      typeof meta.medicaid_status === "string" && meta.medicaid_status ? meta.medicaid_status : null,
    veteranStatus:
      meta.veteran_status === "yes" || meta.veteran_status === "no"
        ? (meta.veteran_status as string)
        : null,
    situation: situationParts[0] ?? null,
  };
  return readFacts(input);
}

// ── Gate 2: fit ────────────────────────────────────────────────────────────

const FIT_SYSTEM = `You are an experienced senior-benefits counselor. Olera picks ONE government program as a family's first phone call and writes them a short letter about it. Judge whether that pick is defensible as a FIRST call, given only what the family told us.

"good"         = a competent counselor in that state could reasonably start here.
"questionable" = defensible, but another program in the same state is clearly a better first call.
"wrong"        = the family's own stated facts rule this program out, or it cannot help with the thing they asked about.

Rules for your judgment:
- Judge only on the facts given. UNKNOWN facts are never disqualifying.
- We never claim the family qualifies, only that a program is worth a call. A program they might not qualify for is still "good" if it is a sensible first try.
- A program that addresses a different need than the one they stated is "wrong", even if they would qualify for it. Energy assistance does not answer "I need care now".
- Prefer naming a concrete better program from the state list over vague advice.

Return ONLY a JSON object:
{"verdict":"good|questionable|wrong","why":"one sentence","better":"a program name from the state list, or null"}`;

export interface FitInput {
  /** Rendered family facts, one per line. */
  factsBlock: string;
  programName: string;
  programSummary: string;
  eligibilitySummary: string;
  /** Every program available in the family's state, for a better-pick suggestion. */
  stateProgramNames: string[];
}

function fitUserMessage(input: FitInput): string {
  return `FAMILY:
${input.factsBlock}

THE PICK:
${input.programName}
what it is: ${input.programSummary || "(no summary held)"}
eligibility: ${input.eligibilitySummary || "(none held)"}

OTHER PROGRAMS AVAILABLE IN THIS STATE:
${input.stateProgramNames.join(", ") || "(none)"}`;
}

function coerceFit(raw: unknown, model: string): FitRead | null {
  const v = (raw as { verdict?: unknown })?.verdict;
  if (v !== "good" && v !== "questionable" && v !== "wrong") return null;
  const r = raw as { why?: unknown; better?: unknown };
  return {
    model,
    verdict: v as FitVerdict,
    why: typeof r.why === "string" ? r.why.trim() : "",
    better: typeof r.better === "string" && r.better.trim() ? r.better.trim() : null,
  };
}

async function fitViaAnthropic(input: FitInput): Promise<FitRead | null> {
  try {
    const message = await anthropic().messages.create({
      model: FIT_MODEL_ANTHROPIC,
      max_tokens: 2000,
      output_config: { effort: "medium" },
      system: FIT_SYSTEM,
      messages: [{ role: "user", content: fitUserMessage(input) }],
    });
    // A safety decline is an unusable read, not an error — hold, do not send.
    if (message.stop_reason === "refusal") return null;
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return coerceFit(parseJson(text), FIT_MODEL_ANTHROPIC);
  } catch {
    return null;
  }
}

/**
 * The exact request body the fit gate sends to OpenAI.
 *
 * Exported so scripts/check-openai-key.ts posts THIS object rather than a
 * hand-written copy of it. That guard passed for hours while every
 * production fit call returned 400, because the copy omitted a parameter the
 * real call sent. A guard that exercises a different payload than production
 * is not a guard.
 *
 * No `temperature`: gpt-5.6-terra accepts only the default of 1 and rejects
 * an explicit 0 outright. Nothing about this call can be pinned — Opus 5
 * removes sampling parameters too — which is why a packet is built once and
 * stored rather than recomputed on read.
 */
export function openAIFitBody(input: FitInput): Record<string, unknown> {
  return {
    model: FIT_MODEL_OPENAI,
    messages: [
      { role: "system", content: FIT_SYSTEM },
      { role: "user", content: fitUserMessage(input) },
    ],
    response_format: { type: "json_object" },
  };
}

export { OPENAI_URL, FIT_MODEL_OPENAI };

async function fitViaOpenAI(input: FitInput): Promise<FitRead | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(openAIFitBody(input)),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return coerceFit(parseJson(body.choices?.[0]?.message?.content ?? ""), FIT_MODEL_OPENAI);
  } catch {
    return null;
  }
}

/**
 * Read fit with every model that is configured, concurrently.
 *
 * Returns only the reads that came back usable. An empty array is a real
 * outcome the router handles as "fit was never read" — it holds the letter,
 * which is the correct behaviour when the gate that matters most did not run.
 * With no OPENAI_API_KEY set this degrades to a single Claude read rather than
 * failing, so the packet still routes.
 */
export async function judgeFit(input: FitInput): Promise<FitRead[]> {
  const reads = await Promise.all([fitViaOpenAI(input), fitViaAnthropic(input)]);
  return reads.filter((r): r is FitRead => r !== null);
}

// ── Gate 3: honesty rails ──────────────────────────────────────────────────

const RAIL_SYSTEM = `You audit letters Olera sends to families of older adults about benefit programs. Check ONLY these four rails. Be strict, but never invent a violation.

qualify  — says or implies the family qualifies, is "in range", "within the limits", or meets a limit; or compares THEIR numbers against a program's limit. Stating what a limit IS is fine. Saying they meet it is not. Also violated by telling a family they do NOT qualify without saying the agency decides and applying is free.
speed    — promises or implies speed: "quick", "easy", "simple", "fast", "just one call", "one phone call", "one call gets it started". Also violated by describing a Medicaid-waiver process without saying it runs weeks to months.
money    — presents a dollar figure as what THIS family will get or save. "Families that qualify often save $X" is FINE. "You could save $X" is NOT.
instruct — orders the family around: "you must", "you need to", "do not call back". Recommending ("I would start with", "it is worth asking about") is correct and is not a violation.

Return ONLY a JSON object:
{"violations":[{"rail":"qualify|speed|money|instruct","quote":"the exact sentence from the letter","why":"one line"}]}
An empty array means the letter is clean.`;

const RAIL_IDS: RailId[] = ["qualify", "speed", "money", "instruct"];

/**
 * Check the letter (and its companion text) against the composer's own
 * Tier-1 rails. Measured base rate on 2026-08-23: 2 hits in 130 drafts, both
 * the speed rail. The gate is cheap insurance on a voice spec that is already
 * working, not the place the system earns its keep.
 */
export async function checkRails(body: string, sms: string | null): Promise<RailHit[]> {
  if (!body.trim()) return [];
  try {
    const message = await anthropic().messages.create({
      model: RAIL_MODEL,
      max_tokens: 1500,
      system: RAIL_SYSTEM,
      messages: [
        {
          role: "user",
          content: `LETTER:\n${body}${sms?.trim() ? `\n\nCOMPANION TEXT:\n${sms}` : ""}`,
        },
      ],
    });
    if (message.stop_reason === "refusal") return [];
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const parsed = parseJson<{ violations?: unknown }>(text);
    const raw = Array.isArray(parsed?.violations) ? parsed!.violations : [];
    return raw
      .map((v) => v as { rail?: unknown; quote?: unknown; why?: unknown })
      .filter((v) => RAIL_IDS.includes(v.rail as RailId) && typeof v.quote === "string")
      .map((v) => ({
        rail: v.rail as RailId,
        quote: String(v.quote).trim(),
        why: typeof v.why === "string" ? v.why.trim() : "",
      }));
  } catch {
    return [];
  }
}

// ── Gate 4: program clearance ──────────────────────────────────────────────

/** Is this string something a person can actually dial? */
function isDialable(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[^\d]/g, "");
  // "2-1-1" is three digits and genuinely dialable; prose is not.
  return digits.length === 3 || digits.length === 10 || digits.length === 11;
}

/**
 * The HIGH structural checks, over the program record the letter actually
 * anchors on. These mirror scripts/benefits-lint.js, which stays the broader
 * offline tool — what is reimplemented here is only the subset that can block
 * a send, so the send path never has to shell out to a script.
 *
 * `null-lead-phone` is the one worth understanding: toPick() falls through to
 * the next contact when contacts[0].phone is null, and on 2026-08-23 that
 * fallthrough landed on plain 2-1-1 for 18 programs and on a named LOCAL
 * office presented as the statewide door for 15 more — several labelled
 * literally "Example: The Senior Alliance (Wayne County)". A family in Grand
 * Rapids calling a Wayne County agency is told it is not their county.
 */
function highFindingsFor(draft: PipelineDraft): string[] {
  const findings: string[] = [];
  const contacts = draft.contacts || [];
  const lead = contacts[0];
  const anchor =
    contacts.find((c) => c.phone && /start here/i.test(c.label)) || contacts.find((c) => !!c.phone);

  if (lead && !lead.phone) findings.push("null-lead-phone");
  if (anchor && !isDialable(anchor.phone)) findings.push("non-dialable-phone");
  if (anchor && /^example[: ]/i.test(anchor.label.trim())) findings.push("example-label-anchor");
  if ((draft.documentsNeeded || []).length === 0) findings.push("empty-documents");

  return findings;
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((Date.now() - then.getTime()) / 86_400_000);
}

/**
 * Read the program's standing clearance from the deployed pipeline bundle.
 *
 * `cleared` requires BOTH a recent stamp and no HIGH finding. The stamp alone
 * is not enough: on 2026-08-23, 11 programs stamped verified inside 30 days
 * still carried a HIGH finding, because the stamp records that a correction
 * round touched the program, not that every field was checked.
 */
export function readClearance(
  stateId: string | null,
  programId: string,
  maxAgeDays: number,
): ClearanceRead | null {
  if (!programId) return null;
  const abbrev = stateId ? getStateAbbrev(stateId) : null;
  const draft = abbrev
    ? pipelineDrafts[abbrev]?.programs?.find((p) => p.id === programId)
    : undefined;
  if (!draft) return null;

  const ageDays = daysSince(draft.lastVerifiedDate);
  const highFindings = highFindingsFor(draft);
  return {
    programId,
    stateId,
    lastVerifiedDate: draft.lastVerifiedDate ?? null,
    ageDays,
    highFindings,
    cleared: highFindings.length === 0 && ageDays != null && ageDays <= maxAgeDays,
  };
}

/** Program display names for the family's state, for the fit gate's suggestion. */
export function stateProgramNames(stateId: string | null): string[] {
  if (!stateId) return [];
  const abbrev = getStateAbbrev(stateId);
  return (pipelineDrafts[abbrev]?.programs || []).map((p) => p.shortName || p.name);
}

/**
 * What the program actually is, for the fit gate.
 *
 * Read from the live pipeline rather than the letter's frozen `pick`
 * snapshot: the snapshot carries the letter's callable facts (name, phone,
 * documents) and deliberately not the prose, so judging fit off it would ask
 * a counselor whether a program is right while telling them only its phone
 * number. This is also the one place the packet WANTS live data over the
 * snapshot — a program whose description has been corrected should be judged
 * as it is today.
 */
export function programContext(
  stateId: string | null,
  programId: string,
): { summary: string; eligibility: string } {
  const abbrev = stateId ? getStateAbbrev(stateId) : null;
  const draft = abbrev
    ? pipelineDrafts[abbrev]?.programs?.find((p) => p.id === programId)
    : undefined;
  if (!draft) return { summary: "", eligibility: "" };
  // structuredEligibility.summary is a string[] of separate requirements —
  // join it rather than letting template interpolation comma-mash the array.
  return {
    summary: (draft.intro || draft.tagline || "").slice(0, 400),
    eligibility: (draft.structuredEligibility?.summary || []).join("; ").slice(0, 300),
  };
}

/** Re-export so callers need only one import for the cheap text pre-check. */
export { statesDollarFigure };
