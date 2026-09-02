import "server-only";

import { getServiceClient } from "@/lib/admin";
import type { FamilyFact, Provenance } from "./types";

/**
 * Assemble what we know about a family, with provenance attached to every fact.
 *
 * This module exists because of one specific failure. On 2026-08-18 a care
 * seeker was told to call about EHEAP, a program requiring someone aged 60 or
 * over in the household. Our record said she was 60. She was not — the value
 * came from an enrichment quiz answer and was simply wrong. She spent a phone
 * call finding that out while in cancer treatment.
 *
 * The lesson is not "validate the age field". It is that eligibility sits at
 * the intersection of facts about the world and facts about this person, and we
 * had no representation of how confident we were in the second kind. A
 * web-grounded fact-checker cannot help here: it has no access to our database.
 *
 * So every fact carries how we know it, and the drafter is forbidden from
 * asserting an eligibility claim on top of an unverified one without either
 * asking or phrasing conditionally. "EHEAP is for households with someone 60 or
 * older, if that's you" costs eight characters and is robust to bad data.
 */

/** Metadata keys we lift into facts, with their display labels. */
const SIMPLE_FACTS: { key: string; label: string }[] = [
  { key: "income_range", label: "Household income" },
  { key: "timeline", label: "Timeline" },
  { key: "relationship_to_recipient", label: "Relationship" },
  { key: "county", label: "County" },
];

interface ProfileRow {
  id: string;
  display_name: string | null;
  state: string | null;
  city: string | null;
  zip: string | null;
  metadata: Record<string, unknown> | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Provenance for a quiz-sourced value. `via: "enrichment"` means we prompted
 * for it after the fact rather than it coming from the original intake, which
 * is exactly where the bad age came from — but both are still self-reported
 * answers to a form, not statements made to a person, so both are
 * `intake_answer`. The distinction that matters is form vs. conversation.
 */
function quizProvenance(): Provenance {
  return "intake_answer";
}

/**
 * Facts about a family, strongest provenance first.
 *
 * Returns an empty array rather than throwing when the profile is missing — a
 * question from an unknown number is still answerable in general terms, it just
 * cannot carry any personalised eligibility claim.
 */
export async function assembleFamilyFacts(profileId: string | null): Promise<FamilyFact[]> {
  if (!profileId) return [];

  const db = getServiceClient();
  const { data, error } = await db
    .from("business_profiles")
    .select("id, display_name, state, city, zip, metadata")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) return [];
  const profile = data as ProfileRow;
  const meta = asRecord(profile.metadata);
  const quiz = asRecord(meta.quiz_answers);
  const facts: FamilyFact[] = [];

  // ── Location ────────────────────────────────────────────────────────────
  // State is set at intake and is the one field we rarely get wrong, but it is
  // still a form answer, so it stays unverified for eligibility purposes.
  if (profile.state) {
    facts.push({
      key: "state",
      label: "State",
      value: String(profile.state),
      provenance: "intake_answer",
      unverified: true,
    });
  }

  // ── Age, the one that broke ─────────────────────────────────────────────
  // `age_status` is set by hand when a family corrects a stored value. When it
  // is present the stored age is NOT trustworthy even if a number survives, so
  // the fact is emitted as an explicit correction rather than a value.
  const ageStatus = typeof meta.age_status === "string" ? meta.age_status : null;
  if (ageStatus) {
    facts.push({
      key: "age",
      label: "Age",
      value:
        meta.age == null
          ? `unknown — previously stored value was corrected by the family (${ageStatus})`
          : `${String(meta.age)} — DISPUTED, corrected by the family (${ageStatus})`,
      provenance: "stated_in_conversation",
      unverified: true,
      correctedByFamily: true,
    });
  } else if (meta.age != null) {
    const quizAge = asRecord(quiz.age);
    facts.push({
      key: "age",
      label: "Age",
      value: String(meta.age),
      provenance: quizProvenance(),
      at: typeof quizAge.at === "string" ? quizAge.at : null,
      unverified: true,
    });
  }

  // ── Simple metadata facts ───────────────────────────────────────────────
  for (const { key, label } of SIMPLE_FACTS) {
    const raw = meta[key];
    if (raw == null || raw === "") continue;
    facts.push({
      key,
      label,
      value: Array.isArray(raw) ? raw.join(", ") : String(raw),
      provenance: quizProvenance(),
      unverified: true,
    });
  }

  // ── Coverage ────────────────────────────────────────────────────────────
  const payment = meta.payment_methods;
  if (Array.isArray(payment) && payment.length) {
    facts.push({
      key: "coverage",
      label: "Coverage",
      value: payment.map(String).join(", "),
      provenance: quizProvenance(),
      unverified: true,
    });
  }

  // ── Anything the family stated in the thread ────────────────────────────
  // These outrank everything above. We do not parse them into structured
  // fields — a wrong parse is worse than raw text the drafter can read.
  //
  // Except that refusing to parse is not the same as refusing to interpret, and
  // on 2026-09-01 that gap produced a wrong name. A care seeker sent her
  // question and then, eleven seconds later, a second text reading only "TJ".
  // It entered here as a fully trusted fact and was rendered to the drafter
  // under "VERIFIED — you may rely on them", so the drafter did: it opened the
  // reply "TJ, in Texas a spouse can't be hired…" and reasoned about her by
  // that name throughout. Nobody knows who TJ is.
  //
  // Provenance answers "how did we learn this", never "does the content mean
  // what we think". A bare fragment has no meaning of its own to inherit trust
  // from — its sense lives entirely in the message it is answering, which we do
  // not track. So fragments stay in the packet, because the next one may be the
  // whole point, but they are labelled for what they actually are.
  const inbound = Array.isArray(meta.sms_inbound) ? meta.sms_inbound : [];
  const recent = inbound.slice(-6);
  for (const entry of recent) {
    const row = asRecord(entry);
    const body = typeof row.body === "string" ? row.body.trim() : "";
    if (!body) continue;
    const fragment = isBareFragment(body);
    facts.push({
      key: fragment ? "said_fragment" : "said",
      label: fragment ? "Sent this on its own" : "Told us directly",
      value: body.slice(0, 400),
      provenance: "stated_in_conversation",
      at: typeof row.at === "string" ? row.at : null,
      unverified: fragment,
    });
  }

  return facts;
}

export interface ThreadTurn {
  direction: "them" | "us";
  body: string;
  at: string;
}

/**
 * What has already been said in this thread, both directions.
 *
 * The drafter has never had this, and the cost showed on 2026-09-01: a family
 * told us four referrals had failed her ("none help"), and the draft came back
 * recommending two of the same four. The facts block carries what she said, but
 * nothing carried what WE said, so the engine had no way to know it was
 * repeating advice that had already not worked.
 *
 * It also fixes a quieter problem. How long a family's messages are is the best
 * available signal for how long ours should be, and the drafter could not see
 * it. One care seeker wrote in four-to-twenty-three character fragments and got
 * a 397-character reply back; she answered "What".
 */
export async function assembleThreadHistory(
  profileId: string | null,
  limit = 8,
): Promise<ThreadTurn[]> {
  if (!profileId) return [];
  const db = getServiceClient();
  if (!db) return [];

  const { data: profile } = await db
    .from("business_profiles")
    .select("phone")
    .eq("id", profileId)
    .maybeSingle();
  const digits = String(profile?.phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return [];
  const last10 = digits.slice(-10);

  const [inboundRes, outboundRes] = await Promise.all([
    db
      .from("sms_inbound")
      .select("body, created_at")
      .eq("phone_last10", last10)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("email_log")
      .select("html_body, created_at, email_type")
      .eq("channel", "sms")
      .eq("recipient", `+1${last10}`)
      // The acknowledgement is the same sentence every time and says nothing
      // about what we recommended. Left in, it can take two of eight slots and
      // push out the message that actually named a program.
      .neq("email_type", "care_seeker_ack")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const turns: ThreadTurn[] = [
    ...(inboundRes.data ?? []).map((r: { body: string | null; created_at: string }) => ({
      direction: "them" as const,
      body: String(r.body ?? "").trim(),
      at: r.created_at as string,
    })),
    ...(outboundRes.data ?? []).map((r: { html_body: string | null; created_at: string }) => ({
      direction: "us" as const,
      // email_log stores SMS bodies as rendered HTML for the shared logger.
      body: String(r.html_body ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      at: r.created_at as string,
    })),
  ].filter((t) => t.body);

  turns.sort((a, b) => a.at.localeCompare(b.at));
  return turns.slice(-limit);
}

/**
 * Render the thread for a model prompt, with the instruction that matters most
 * stated where it cannot be missed.
 */
export function renderThreadForPrompt(turns: ThreadTurn[]): string {
  if (!turns.length) return "(no earlier messages in this thread)";
  const lines = turns.map((t) => `  ${t.direction === "them" ? "THEM" : "US  "}: ${t.body}`);
  const theirs = turns.filter((t) => t.direction === "them");
  const typical = theirs.length
    ? Math.round(theirs.reduce((n, t) => n + t.body.length, 0) / theirs.length)
    : 0;
  return [
    "THE CONVERSATION SO FAR, oldest first:",
    ...lines,
    "",
    "Do NOT recommend anything above that they have already told you did not work. Naming it again reads as not having listened, and it costs them another call they cannot afford.",
    theirs.length
      ? `They write about ${typical} characters at a time. Answer at a length they can take in. A short reply to a short message is respect, not laziness.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * A message with too little structure to carry its own meaning.
 *
 * "TJ", "60", "yes", "no" — each is a complete answer to a question we did not
 * record asking, and a complete invitation to invent one. Deliberately narrow:
 * anything with sentence punctuation or three or more words is left alone,
 * because over-flagging real answers would push the drafter to hedge things the
 * family actually told it plainly, and hedging an accurate fact has a cost too.
 */
export function isBareFragment(body: string): boolean {
  const t = body.trim();
  if (!t) return false;
  if (t.length > 24) return false;
  if (/[.!?]/.test(t)) return false;
  return t.split(/\s+/).filter(Boolean).length <= 2;
}

/**
 * Render facts for a model prompt, provenance made explicit and impossible to
 * miss. The wording is deliberately blunt: models will happily treat a listed
 * attribute as ground truth unless told otherwise in the same breath.
 */
export function renderFactsForPrompt(facts: FamilyFact[]): string {
  if (!facts.length) {
    return "NOTHING IS KNOWN about this person beyond the message itself. Do not make any claim that depends on their age, income, location, or coverage.";
  }

  const stated = facts.filter(
    (f) => f.provenance === "stated_in_conversation" && f.key !== "said_fragment",
  );
  const fragments = facts.filter((f) => f.key === "said_fragment");
  const rest = facts.filter((f) => f.provenance !== "stated_in_conversation");

  const lines: string[] = [];

  if (stated.length) {
    lines.push("VERIFIED — the family stated these to us directly. You may rely on them:");
    for (const f of stated) {
      lines.push(`  - ${f.label}: ${f.value}${f.correctedByFamily ? "  [THEY CORRECTED US ON THIS]" : ""}`);
    }
  }

  // Its own section, and worded harder than the unverified block, because the
  // failure here is not "this might be wrong" but "you will invent what this
  // means". They did send it; what it refers to is the unknown.
  if (fragments.length) {
    lines.push("");
    lines.push(
      "MEANING UNKNOWN — they sent these on their own, with nothing around them. They ARE from the family, but a bare word or number answers a question we did not record asking, so you do NOT know what it refers to. Never read one as a name, an age, a yes, or a no. Do not address the person by anything found here. If one of these looks like it matters, ask what it meant:",
    );
    for (const f of fragments) {
      lines.push(`  - ${f.value}`);
    }
  }

  if (rest.length) {
    lines.push("");
    lines.push(
      "UNVERIFIED — these came from a form, not from a person. They are often right and sometimes badly wrong. You may NOT assert an eligibility conclusion that depends on any of them. Ask, or phrase the claim conditionally:",
    );
    for (const f of rest) {
      lines.push(`  - ${f.label}: ${f.value}`);
    }
  }

  return lines.join("\n");
}

/** The family's state code, when we have one. Used to scope the library search. */
export function stateFromFacts(facts: FamilyFact[]): string | null {
  return facts.find((f) => f.key === "state")?.value ?? null;
}
