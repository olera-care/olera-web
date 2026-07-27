/**
 * Benefits Cascade — the post-intake help rungs (Phase 2 of the benefits
 * admin work; see the "Phase 2 Redesign" section of the 2026-07-27 handoff).
 *
 * Posture: assume the family has NOT applied (base rate of solo completion of
 * a government benefits application ≈ 0). Rung B1 (day 2-3) shrinks the first
 * step to ten minutes: ONE program, its start-here phone number, a short call
 * script, the top documents to have nearby. Rung B2 (~3 days later) is a
 * check-in whose reply options all point forward; outcome data is the exhaust
 * of helping, never an audit.
 *
 * This module owns first-step program SELECTION + content assembly, and the
 * benefits_cascade metadata shape shared by the coordinator, the capture API,
 * and the admin Families queue. Server-only (reads with the service client).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { pipelineDrafts } from "@/data/pipeline-drafts";
import type { PipelineDraft } from "@/data/pipeline-drafts-types";
import { getStateAbbrev, getStateSlug } from "@/lib/program-data";

// ── benefits_cascade metadata (on business_profiles.metadata) ───────────────

export type BenefitsOutcomeValue = "moving" | "wants_help" | "wrong_program";

export interface BenefitsCascadeMeta {
  first_step_sent_at?: string;
  first_step_program_id?: string;
  /** State SLUG (e.g. "florida") — matches saved_programs.state_id and the
   *  /benefits/{stateId}/{programId} route. */
  first_step_state_id?: string;
  first_step_program_name?: string;
  check_sent_at?: string;
  outcome?: BenefitsOutcomeValue;
  outcome_at?: string;
  /** One-tap "what didn't fit" from the wrong_program landing path. */
  outcome_reason?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readBenefitsCascade(profileMeta: Record<string, any> | null | undefined): BenefitsCascadeMeta {
  const raw = profileMeta?.benefits_cascade;
  return raw && typeof raw === "object" ? (raw as BenefitsCascadeMeta) : {};
}

/** When the family completed the benefits intake (save-results stamps
 *  metadata.benefits_results.completed_at). Null = not a benefits family. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function benefitsCompletedAt(profileMeta: Record<string, any> | null | undefined): string | null {
  const raw = profileMeta?.benefits_results?.completed_at;
  return typeof raw === "string" && raw ? raw : null;
}

export type CascadeStatus = "matched" | "first_step_sent" | BenefitsOutcomeValue;

/** Queue-facing status ladder: matched → first_step_sent → outcome. */
export function cascadeStatus(cascade: BenefitsCascadeMeta): CascadeStatus {
  if (cascade.outcome) return cascade.outcome;
  if (cascade.first_step_sent_at) return "first_step_sent";
  return "matched";
}

// ── First-step program selection ────────────────────────────────────────────

export interface FirstStepPick {
  programId: string;
  /** State slug for the program page route. */
  stateId: string;
  stateAbbrev: string;
  /** How this program was chosen — "entry" means it's the program page the
   *  family arrived through, which the email calls out for recognition. */
  source: "entry" | "saved" | "state";
  name: string;
  shortName: string;
  savingsRange: string | null;
  complexity: string;
  contact: { label: string; phone: string; hours: string | null; description: string | null };
  /** Top documents to have nearby — capped at 3 (ten minutes, not a filing). */
  documents: string[];
  tip: string | null;
  /** Site-relative program page path. */
  programPath: string;
}

const COMPLEXITY_RANK: Record<string, number> = { simple: 0, medium: 1, deep: 2 };

function draftFor(stateAbbrev: string, programId: string): PipelineDraft | null {
  const programs = pipelineDrafts[stateAbbrev]?.programs;
  return programs?.find((p) => p.id === programId) ?? null;
}

/** A draft can anchor a first-step email only when it carries the v3 content:
 *  a callable contact + a document list. Returns the pick or null. */
function toPick(
  draft: PipelineDraft,
  stateAbbrev: string,
  stateId: string,
  source: FirstStepPick["source"],
): FirstStepPick | null {
  const contacts = draft.contacts || [];
  const contact =
    contacts.find((c) => c.phone && /start here/i.test(c.label)) ||
    contacts.find((c) => !!c.phone);
  const documents = (draft.documentsNeeded || []).slice(0, 3);
  if (!contact?.phone || documents.length === 0) return null;
  return {
    programId: draft.id,
    stateId,
    stateAbbrev,
    source,
    name: draft.name,
    shortName: draft.shortName || draft.name,
    savingsRange: draft.savingsRange?.trim() || null,
    complexity: draft.complexity,
    contact: {
      label: contact.label,
      phone: contact.phone,
      hours: contact.hours ?? null,
      description: contact.description ?? null,
    },
    documents,
    tip: draft.applicationGuide?.tip?.trim() || null,
    programPath: `/benefits/${stateId}/${draft.id}`,
  };
}

/** Parse "/benefits/{stateSlug}/{programId}" out of an entry-source path. */
function parseEntrySourceProgram(entrySource: string | null | undefined): { stateId: string; programId: string } | null {
  if (!entrySource) return null;
  const segs = entrySource.split("?")[0].split("/").filter(Boolean);
  if (segs.length === 3 && segs[0] === "benefits") return { stateId: segs[1], programId: segs[2] };
  return null;
}

/**
 * Pick the ONE program for the family's first step.
 *
 * Order (momentum before the big waiver application):
 *   1. The entry-source program — they arrived through a specific program
 *      page (LIHEAP, Weatherization…), which is both demonstrated intent and,
 *      given the funnel's energy-assistance skew, usually a low-burden quick
 *      win already.
 *   2. Their saved matches, lowest complexity first (simple > medium > deep),
 *      keeping the saved order (match score) within a complexity band.
 *   3. The state's stateOverview.startHere list.
 *
 * Every candidate must clear toPick (callable contact + documents). Returns
 * null when nothing qualifies — the coordinator then skips rung B1 for this
 * family rather than sending a hollow email.
 */
export async function selectFirstStepProgram(
  db: SupabaseClient,
  opts: { accountId: string; stateAbbrev: string | null },
): Promise<FirstStepPick | null> {
  const { data: account } = await db
    .from("accounts")
    .select("user_id, signup_source")
    .eq("id", opts.accountId)
    .maybeSingle();
  if (!account?.user_id) return null;

  // 1. Entry-source program page.
  const entry = parseEntrySourceProgram(account.signup_source);
  if (entry) {
    const abbrev = getStateAbbrev(entry.stateId);
    const draft = draftFor(abbrev, entry.programId);
    if (draft) {
      const pick = toPick(draft, abbrev, entry.stateId, "entry");
      if (pick) return pick;
    }
  }

  // 2. Saved matches by ascending complexity. saved_programs.state_id is the
  //    state slug; federal programs have no per-state draft and drop out here.
  const { data: saved } = await db
    .from("saved_programs")
    .select("program_id, state_id, created_at")
    .eq("user_id", account.user_id)
    .order("created_at", { ascending: true });

  const candidates: { pick: FirstStepPick; rank: number; idx: number }[] = [];
  (saved || []).forEach((row, idx) => {
    if (!row.program_id || !row.state_id) return;
    const abbrev = getStateAbbrev(row.state_id);
    const draft = draftFor(abbrev, row.program_id);
    if (!draft) return;
    const pick = toPick(draft, abbrev, row.state_id, "saved");
    if (!pick) return;
    candidates.push({ pick, rank: COMPLEXITY_RANK[draft.complexity] ?? 3, idx });
  });
  candidates.sort((a, b) => a.rank - b.rank || a.idx - b.idx);
  if (candidates[0]) return candidates[0].pick;

  // 3. State fallback: the pipeline's own "start here" list.
  if (opts.stateAbbrev) {
    const abbrev = opts.stateAbbrev.toUpperCase();
    const stateId = getStateSlug(abbrev);
    const startHere = pipelineDrafts[abbrev]?.stateOverview?.startHere || [];
    if (stateId) {
      for (const s of startHere) {
        const draft = draftFor(abbrev, s.programId);
        if (!draft) continue;
        const pick = toPick(draft, abbrev, stateId, "state");
        if (pick) return pick;
      }
    }
  }

  return null;
}

// ── Call script ─────────────────────────────────────────────────────────────

/** Two spoken lines the family can read off the screen. `relationship` is the
 *  free-form display value ("Parent", "Spouse", "Self", "Family member"). */
export function buildCallScript(programShortName: string, relationship: string | null): string {
  const forWhom =
    relationship === "Self"
      ? "for myself"
      : relationship === "Spouse"
        ? "for my spouse"
        : relationship === "Parent"
          ? "for my parent"
          : "for a family member";
  return `Hi, I'm calling to ask about ${programShortName}. I'd like to apply ${forWhom}. Could you help me get started, or point me to the right person?`;
}
