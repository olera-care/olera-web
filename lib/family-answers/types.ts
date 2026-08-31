/**
 * The Family Answers review packet — the contract between the engine and the
 * human who approves what gets sent.
 *
 * The design target for this whole subsystem is NOT "write a good draft". It is
 * "make the reviewer able to catch an error he does not have the expertise to
 * catch". The reviewer is one person with working but non-specialist knowledge
 * of benefits programs, so a polished paragraph is the worst possible output:
 * it reads as authoritative and gives him nothing to check.
 *
 * Everything in this file exists to make the packet *checkable*:
 *   - every claim carries where it came from            (SourcedClaim)
 *   - every fact about the family carries how we know it (FamilyFact)
 *   - every disagreement between the drafter and the
 *     adversarial checker is preserved, including the
 *     ones the drafter won                               (Objection)
 *   - facts the answer DEPENDS on but cannot verify are
 *     surfaced separately, because that is the failure
 *     that actually happened                             (PersonFactRisk)
 *
 * On 2026-08-18 a message went out recommending an age-gated program to someone
 * who was not that age, because the stored age was wrong. An external
 * fact-checker reviewed the message twice and never caught it — it cannot, it
 * has no access to whether our record about a person is true. Only the care
 * seeker caught it. PersonFactRisk is the response to that.
 */

/**
 * How we know a fact about the family, best first.
 *
 * The ordering is load-bearing: an eligibility claim may rest on
 * `stated_in_conversation` directly, but anything below that must be hedged or
 * asked about rather than asserted.
 */
export type Provenance =
  /** They told us in this SMS thread. Strongest thing we have. */
  | "stated_in_conversation"
  /** They answered an intake or enrichment quiz. Often right, sometimes not. */
  | "intake_answer"
  /** We derived or guessed it (area code, geo lookup, enrichment). Weakest. */
  | "inferred";

export interface FamilyFact {
  /** Stable key: "age", "income_range", "state", "county", "coverage". */
  key: string;
  /** Human label for the review surface. */
  label: string;
  value: string;
  provenance: Provenance;
  /** ISO timestamp of when we learned it, when known. */
  at?: string | null;
  /**
   * True when an eligibility claim must NOT rest on this fact without either
   * asking or phrasing conditionally. Anything not stated in the conversation
   * is unverified.
   */
  unverified: boolean;
  /** Set when the family has explicitly corrected a previously stored value. */
  correctedByFamily?: boolean;
}

/** A single factual assertion in the draft, with its source. */
export interface SourcedClaim {
  claim: string;
  sourceUrl: string | null;
  sourceLabel: string;
  /**
   * primary   — the administering agency's own page or an official state PDF
   * secondary — a news article, aggregator, or third-party summary
   * unsourced — the model asserted it and could not point anywhere
   *
   * `unsourced` claims must never survive into a sent message.
   */
  confidence: "primary" | "secondary" | "unsourced";
}

/**
 * One objection from the adversarial checker and what the drafter said back.
 *
 * Both outcomes are kept. A verifier with no counter-party ratchets every
 * message toward "contact your local agency for more information", which is
 * safe and useless — hedging has a cost the checker never pays. Preserving the
 * contested ones lets the reviewer see the argument rather than only the
 * result, which is the difference between a judgement he can make and one he
 * has to take on faith.
 */
export interface Objection {
  /** The part of the draft being attacked. */
  target: string;
  /** What the checker said was wrong. */
  objection: string;
  /** Whether the drafter conceded or pushed back. */
  verdict: "accepted" | "contested";
  /** The drafter's reasoning, and the source if it contested. */
  response: string;
  sourceUrl?: string | null;
}

/**
 * A fact the answer depends on that we cannot verify. This is the section the
 * reviewer should read first, and the review surface must not let it collapse.
 */
export interface PersonFactRisk {
  /** Which FamilyFact key this is about. */
  factKey: string;
  /** Plain statement of the exposure, e.g. "EHEAP requires someone 60+". */
  why: string;
  /** How the draft handles it: asked, phrased conditionally, or relied upon. */
  handling: "asked" | "conditional" | "relied_upon";
}

/** What the triage pass concluded before any research ran. */
export interface TriageResult {
  /** benefits_question | status_update | thanks | unrelated | crisis */
  category: string;
  /** The model's independent crisis read, separate from the regex in the webhook. */
  isCrisis: boolean;
  /** Why, when isCrisis is true. */
  crisisReason?: string | null;
  /** True when the regex and the model disagreed. Always pages a human. */
  disagreedWithRegex?: boolean;
  /** One-line restatement of what the family is actually asking. */
  question: string;
}

export interface AnswerPacket {
  version: 1;
  /** The family's message, verbatim. */
  inbound: string;
  triage: TriageResult;
  facts: FamilyFact[];
  /** The proposed reply. Must be <= 480 characters. */
  draft: string;
  claims: SourcedClaim[];
  objections: Objection[];
  personFactRisks: PersonFactRisk[];
  /**
   * Programs the research found that are NOT in the Olera benefits library.
   * Flagged for a human to write up; never auto-committed. The EHEAP addition
   * on 2026-08-18 is the template for what closing one looks like.
   */
  libraryGaps: string[];
  generatedAt: string;
  models: Record<string, string>;
  /** Populated when a stage failed; the packet is still stored for triage. */
  errors?: string[];
}

/**
 * One adversarial re-check a human ran against an edited draft, stored on
 * family_answer_jobs.rechecks.
 *
 * The packet's own `objections` are bound to `packet.draft`. A reviewer who
 * rewrites the draft invalidates all of them at once, and the review surface
 * goes on displaying a source count that belongs to superseded text. This is
 * the record that the replacement was attacked too, and by whom.
 *
 * Append-only. The history is the point: what got challenged and what the
 * reviewer did about it says more about the engine than the final draft does.
 */
export interface RecheckRecord {
  at: string;
  /** Admin email that ran it. */
  by: string;
  /** The draft as it stood when checked. */
  draft: string;
  claims: SourcedClaim[];
  objections: Objection[];
  /** Stage 5's revision. Offered to the reviewer, never applied automatically. */
  suggestedDraft: string;
  notes: string;
  errors?: string[];
}

/** Characters. Matches the reply box, the sms_drafts CHECK, and Twilio. */
export const MAX_REPLY_CHARS = 480;

/** True when nothing in the packet may be sent without a human editing it first. */
export function packetNeedsAttention(packet: AnswerPacket): boolean {
  return (
    packet.triage.isCrisis ||
    Boolean(packet.triage.disagreedWithRegex) ||
    packet.claims.some((c) => c.confidence === "unsourced") ||
    packet.personFactRisks.some((r) => r.handling === "relied_upon") ||
    packet.draft.length > MAX_REPLY_CHARS ||
    Boolean(packet.errors?.length)
  );
}
