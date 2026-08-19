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
  const inbound = Array.isArray(meta.sms_inbound) ? meta.sms_inbound : [];
  const recent = inbound.slice(-6);
  for (const entry of recent) {
    const row = asRecord(entry);
    const body = typeof row.body === "string" ? row.body.trim() : "";
    if (!body) continue;
    facts.push({
      key: "said",
      label: "Told us directly",
      value: body.slice(0, 400),
      provenance: "stated_in_conversation",
      at: typeof row.at === "string" ? row.at : null,
      unverified: false,
    });
  }

  return facts;
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

  const stated = facts.filter((f) => f.provenance === "stated_in_conversation");
  const rest = facts.filter((f) => f.provenance !== "stated_in_conversation");

  const lines: string[] = [];

  if (stated.length) {
    lines.push("VERIFIED — the family stated these to us directly. You may rely on them:");
    for (const f of stated) {
      lines.push(`  - ${f.label}: ${f.value}${f.correctedByFamily ? "  [THEY CORRECTED US ON THIS]" : ""}`);
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
