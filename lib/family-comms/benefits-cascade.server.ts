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
import type { FamilyBenefitsFacts } from "@/lib/family-comms/benefits-guidance.server";
import {
  evaluateProgramForFamily,
  hasEligibilityFacts,
  incomeLimitFromTable,
  loadSbfEligibility,
  resolveSbfRow,
  type SbfEligibilityRow,
} from "@/lib/benefits/eligibility.server";
import { getStateAbbrev, getStateSlug } from "@/lib/program-data";
import { sendSMS, normalizeUSPhone } from "@/lib/twilio";
import { benefitsResultsSms } from "@/lib/sms/templates";
import { getSiteUrl } from "@/lib/site-url";
import { sendSlackAlert } from "@/lib/slack";

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
  /** Living-journey page acts (v2): the family tapped "I made the call" /
   *  checked documents on /m/{token}. Distinct from `outcome` (the check-in
   *  self-report) — this is the page-observed act. */
  first_step_done_at?: string;
  first_step_done_program_id?: string;
  docs_checked?: string[];
  /** SMS mirror stamps (consent-gated companions to the B1/B2 emails). */
  first_step_sms_at?: string;
  /** Scheduled navigator sends that fired outside the recipient's quiet
   *  hours park the companion text in sms_queue — this is its due time. */
  first_step_sms_queued_for?: string;
  check_sms_at?: string;
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

// ── Case management (the caseload view, TJ 2026-07-28) ──────────────────────

/** Admin case actions stored on the profile: metadata.benefits_case. */
export interface BenefitsCaseMeta {
  notes?: { at: string; by: string; text: string }[];
  contacted_at?: string;
  resolved_at?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readBenefitsCase(profileMeta: Record<string, any> | null | undefined): BenefitsCaseMeta {
  const raw = profileMeta?.benefits_case;
  return raw && typeof raw === "object" ? (raw as BenefitsCaseMeta) : {};
}

/** Stuck states, most severe first. The cascade is the automated first
 *  responder; after two ignored touches the next touch is a HUMAN — these
 *  states are the routing. Resolved cases and moving families never float;
 *  "contacted" suppresses the float for 7 days (the case is being worked). */
export type CaseStatus =
  | "wants_help"
  | "silent_after_checkin"
  | "action_stall"
  | "attention_stall";

const CASE_DAY = 24 * 60 * 60 * 1000;

export function caseStatus(
  cascade: BenefitsCascadeMeta,
  caseMeta: BenefitsCaseMeta,
  lastViewedAt: string | null,
  now: number,
): CaseStatus | null {
  if (caseMeta.resolved_at) return null;
  if (cascade.outcome === "moving" || cascade.first_step_done_at) return null;
  if (caseMeta.contacted_at && now - new Date(caseMeta.contacted_at).getTime() < 7 * CASE_DAY) {
    return null;
  }
  if (cascade.outcome === "wants_help") return "wants_help";
  if (cascade.outcome === "wrong_program") return null;

  // Once the check-in is out, IT owns the verdict: silent after 4 days, or
  // nothing yet. Declaring a stall while the automated follow-up is still in
  // flight would double-count the same silence.
  if (cascade.check_sent_at) {
    return now - new Date(cascade.check_sent_at).getTime() >= 4 * CASE_DAY
      ? "silent_after_checkin"
      : null;
  }
  if (cascade.first_step_sent_at) {
    const sentAt = new Date(cascade.first_step_sent_at).getTime();
    const viewedSinceSend = !!lastViewedAt && new Date(lastViewedAt).getTime() >= sentAt;
    if (viewedSinceSend && now - sentAt >= 4 * CASE_DAY) return "action_stall";
    if (!viewedSinceSend && now - sentAt >= 3 * CASE_DAY) return "attention_stall";
  }
  return null;
}

// ── Unified lifecycle (the family's journey, one vocabulary — TJ 2026-07-28) ─

export type LifecycleStatus =
  | "needs_help"
  | "stalled"
  | "acting"
  | "returned"
  | "working"
  | "resolved"
  | "new"
  | "in_cascade";

export interface Lifecycle {
  status: LifecycleStatus;
  /** Short human sub-label, e.g. "never saw plan" / "said it didn't fit". */
  detail: string | null;
}

/** One family-centric status with strict precedence, replacing the three
 *  system vocabularies (signals / cascade / case) in the queue. */
export function lifecycleStatus(opts: {
  cascade: BenefitsCascadeMeta;
  caseMeta: BenefitsCaseMeta;
  completedAt: string;
  lastViewedAt: string | null;
  now: number;
}): Lifecycle {
  const { cascade, caseMeta, completedAt, lastViewedAt, now } = opts;
  if (caseMeta.resolved_at) return { status: "resolved", detail: null };
  if (caseMeta.contacted_at && now - new Date(caseMeta.contacted_at).getTime() < 7 * CASE_DAY) {
    return { status: "working", detail: "contacted" };
  }
  if (cascade.outcome === "wants_help") return { status: "needs_help", detail: "asked for a person" };

  const stuck = caseStatus(cascade, caseMeta, lastViewedAt, now);
  if (stuck === "silent_after_checkin") {
    // Engaged with the check-in era (viewed their plan after it went out) then
    // went quiet = requested info, no follow-up → a human's case, not a stall.
    const viewedAfterCheck =
      !!lastViewedAt &&
      !!cascade.check_sent_at &&
      new Date(lastViewedAt).getTime() >= new Date(cascade.check_sent_at).getTime();
    return viewedAfterCheck
      ? { status: "needs_help", detail: "engaged, then went quiet" }
      : { status: "stalled", detail: "silent after check-in" };
  }
  if (stuck === "action_stall") return { status: "stalled", detail: "saw plan, no call yet" };
  if (stuck === "attention_stall") return { status: "stalled", detail: "never saw their plan" };

  if (cascade.first_step_done_at) return { status: "acting", detail: "made the call" };
  if (cascade.outcome === "moving") return { status: "acting", detail: "says it's moving" };
  if ((cascade.docs_checked?.length ?? 0) > 0) {
    return { status: "acting", detail: `${cascade.docs_checked!.length} docs ready` };
  }
  if (cascade.outcome === "wrong_program") return { status: "returned", detail: "said it didn't fit" };

  const completedMs = new Date(completedAt).getTime();
  if (lastViewedAt && new Date(lastViewedAt).getTime() - completedMs > CASE_DAY) {
    return { status: "returned", detail: "came back to their plan" };
  }
  if (now - completedMs < 2 * CASE_DAY) return { status: "new", detail: null };
  return { status: "in_cascade", detail: cascade.first_step_sent_at ? "first step sent" : "awaiting first step" };
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
 * Every candidate must clear toPick (callable contact + documents). When the
 * family has given eligibility facts (Phase 3), candidates their facts rule
 * out are skipped at every tier — an under-65 family entering through a 65+
 * program page should not get that program as their ten-minute first step.
 * Returns null when nothing qualifies — the coordinator then skips rung B1
 * for this family rather than sending a hollow email.
 */
export async function selectFirstStepProgram(
  db: SupabaseClient,
  opts: {
    accountId: string;
    stateAbbrev: string | null;
    /** Program ids to skip — the living journey uses this to pick "up next"
     *  after the first step is done. */
    exclude?: string[];
    /** The family's benefits facts (familyBenefitsFacts over their profile).
     *  Omitted or fact-free → no eligibility screening, selection unchanged. */
    facts?: FamilyBenefitsFacts | null;
    /** Pin to the program a SENT navigator letter named (benefits_cascade
     *  first_step_program_id/state_id). Once TJ told the family "start with
     *  X", the plan page must show X — recomputing could greet them with a
     *  different program than the letter promised. Bypasses the eligibility
     *  screen deliberately: TJ approved the letter, and contradicting it is
     *  worse than a soft rule firing late. Falls through to the normal
     *  ladder when the pinned program has no callable content. */
    pin?: { programId: string; stateId: string | null } | null;
  },
): Promise<FirstStepPick | null> {
  const excluded = new Set(opts.exclude || []);

  if (opts.pin?.programId && opts.pin.stateId && opts.stateAbbrev && !excluded.has(opts.pin.programId)) {
    const pinnedDraft = draftFor(opts.stateAbbrev, opts.pin.programId);
    if (pinnedDraft) {
      const pinned = toPick(pinnedDraft, opts.stateAbbrev, opts.pin.stateId, "saved");
      if (pinned) return pinned;
    }
  }

  // Eligibility screen (conservative: unknown facts and unjoined programs
  // always pass). sbf rows load once, only when there are facts to apply.
  const facts = opts.facts && hasEligibilityFacts(opts.facts) ? opts.facts : null;
  let sbfRows: SbfEligibilityRow[] = [];
  if (facts) {
    sbfRows = await loadSbfEligibility(db, opts.stateAbbrev);
  }
  const factsRuleOut = (draft: PipelineDraft, stateId: string): boolean => {
    if (!facts) return false;
    const stateName = stateId.replace(/-/g, " ");
    const verdict = evaluateProgramForFamily(
      {
        name: draft.name,
        ageRequirement: draft.structuredEligibility?.ageRequirement,
        eligibilitySummary: draft.structuredEligibility?.summary,
        incomeLimitSingle: incomeLimitFromTable(draft.structuredEligibility?.incomeTable),
      },
      resolveSbfRow(sbfRows, draft.name, stateName),
      facts,
    );
    return verdict.ruledOut;
  };
  const { data: account } = await db
    .from("accounts")
    .select("user_id, signup_source")
    .eq("id", opts.accountId)
    .maybeSingle();
  if (!account?.user_id) return null;

  // 1. Entry-source program page.
  const entry = parseEntrySourceProgram(account.signup_source);
  if (entry && !excluded.has(entry.programId)) {
    const abbrev = getStateAbbrev(entry.stateId);
    const draft = draftFor(abbrev, entry.programId);
    if (draft && !factsRuleOut(draft, entry.stateId)) {
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
    if (!row.program_id || !row.state_id || excluded.has(row.program_id)) return;
    const abbrev = getStateAbbrev(row.state_id);
    const draft = draftFor(abbrev, row.program_id);
    if (!draft) return;
    if (factsRuleOut(draft, row.state_id)) return;
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
        if (excluded.has(s.programId)) continue;
        const draft = draftFor(abbrev, s.programId);
        if (!draft) continue;
        if (factsRuleOut(draft, stateId)) continue;
        const pick = toPick(draft, abbrev, stateId, "state");
        if (pick) return pick;
      }
    }
  }

  return null;
}

// ── Situation line (Phase 3 honesty) ────────────────────────────────────────

/** Humanize the family's held eligibility facts into one line ("age 72, on
 *  Medicaid, income $1,500–$2,500/mo"). Null when we hold nothing — callers
 *  render their own "unknown" placeholder (or nothing at all). Same
 *  vocabulary as the Slack benefits_completed alert. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function benefitsSituationLine(profileMeta: Record<string, any> | null | undefined): string | null {
  const meta = profileMeta || {};
  const parts: string[] = [];
  if (typeof meta.age === "number" && meta.age > 0) parts.push(`age ${meta.age}`);
  const medicaid = meta.medicaid_status as string | undefined;
  if (medicaid === "alreadyHas") parts.push("on Medicaid");
  else if (medicaid === "doesNotHave") parts.push("not on Medicaid");
  else if (medicaid === "applying") parts.push("applying for Medicaid");
  else if (medicaid === "notSure") parts.push("Medicaid: not sure");
  const incomeLabels: Record<string, string> = {
    under1500: "income under $1,500/mo",
    under2500: "income $1,500–$2,500/mo",
    under4000: "income $2,500–$4,000/mo",
    over4000: "income over $4,000/mo",
    under6000: "income $4,000–$6,000/mo",
    over6000: "income over $6,000/mo",
  };
  const income = meta.income_range as string | undefined;
  if (income && incomeLabels[income]) parts.push(incomeLabels[income]);
  // "Not sure yet" on the payment step — the family self-identifying as
  // needing the benefits path. Triage-relevant, so it rides the same line.
  if (meta.payment_unsure) parts.push("unsure how to pay");
  return parts.length > 0 ? parts.join(", ") : null;
}

// ── Phone capture ───────────────────────────────────────────────────────────

/** "your parent" / "your spouse" / "you" / "your family" — from either the
 *  enrichment enum (self|parent|spouse|other) or the stored display value
 *  (Self|Parent|Spouse|Family member). */
export function familyPhraseFromRelationship(rel: string | null | undefined): string {
  const v = (rel || "").toLowerCase();
  if (v === "self" || v === "myself") return "you";
  if (v.includes("parent")) return "your parent";
  if (v.includes("spouse")) return "your spouse";
  return "your family";
}

/**
 * Capture a family's phone number and keep the promise immediately: store it
 * (fill-if-empty; a DIFFERING existing number is never overwritten and gets no
 * SMS — texting an unstored number would mislead), stamp
 * metadata.sms_consent (the 10DLC audit record, and the gate the future SMS
 * cascade rungs will require), and text the results link right away.
 *
 * Metadata is read FRESH inside this call so the consent merge can't clobber
 * writes made earlier in the same request (e.g. syncIntentToProfile).
 * The SMS is awaited — Vercel kills pending promises after the response.
 */
export async function captureFamilyPhoneAndTextResults(
  db: SupabaseClient,
  opts: {
    profileId: string;
    rawPhone: string;
    /** Consent provenance, e.g. "benefits_enrichment" | "benefits_outcome_help". */
    source: string;
    familyPhrase?: string;
  },
): Promise<{ stored: boolean; smsSent: boolean }> {
  const normalized = normalizeUSPhone(opts.rawPhone);
  if (!normalized) return { stored: false, smsSent: false };

  const { data: profile } = await db
    .from("business_profiles")
    .select("id, phone, metadata, display_name, state")
    .eq("id", opts.profileId)
    .single();
  if (!profile) return { stored: false, smsSent: false };

  const existing = (profile.phone || "").trim();
  const sameAsExisting = existing ? normalizeUSPhone(existing) === normalized : false;
  if (existing && !sameAsExisting) return { stored: false, smsSent: false };

  const meta = (profile.metadata as Record<string, unknown>) || {};
  const update: Record<string, unknown> = {
    metadata: {
      ...meta,
      sms_consent: { at: new Date().toISOString(), source: opts.source },
    },
  };
  if (!existing) update.phone = normalized;
  const { error: updErr } = await db
    .from("business_profiles")
    .update(update)
    .eq("id", opts.profileId);
  if (updErr) {
    console.error("[captureFamilyPhone] update failed:", updErr);
    return { stored: false, smsSent: false };
  }

  // Slack ping — a captured phone is the scarce asset (only ~3% of benefits
  // families had one before capture shipped), so the team hears about each.
  // Awaited (serverless), never fatal.
  const pingSlack = async (smsStatus: string) => {
    try {
      const name = profile.display_name?.trim();
      const who = name && name.toLowerCase() !== "care seeker" ? name : "A family";
      const sourceLabel =
        opts.source === "benefits_enrichment"
          ? "post-capture enrichment"
          : opts.source === "benefits_outcome_help"
            ? "wants-help page"
            : opts.source;
      await sendSlackAlert(
        `📱 ${who}${profile.state ? ` (${profile.state})` : ""} shared their phone number via ${sourceLabel}: ${normalized}. ` +
          `${smsStatus} <${getSiteUrl()}/admin/care-seekers/${opts.profileId}|Open family>`,
      );
    } catch (slackErr) {
      console.error("[captureFamilyPhone] Slack ping failed:", slackErr);
    }
  };

  const { data: tokenRow } = await db
    .from("benefits_results_tokens")
    .select("token, match_count")
    .eq("profile_id", opts.profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!tokenRow?.token) {
    await pingSlack("No results token on file, no text sent.");
    return { stored: true, smsSent: false };
  }

  const result = await sendSMS({
    to: normalized,
    body: benefitsResultsSms({
      matchCount: tokenRow.match_count || 0,
      familyPhrase: opts.familyPhrase || "your family",
      url: `${getSiteUrl()}/m/${tokenRow.token}`,
    }),
    // Ledger entry (channel='sms') so the send shows on /admin/family-comms.
    // benefits_results_sms is transactional — deliberately NOT a governed type.
    emailType: "benefits_results_sms",
    recipientType: "family",
    recipientLogProfileId: opts.profileId,
  });
  if (!result.success) {
    console.error("[captureFamilyPhone] results SMS failed:", result.error);
    // Twilio 21610 = recipient previously texted STOP.
    if (result.error?.includes("21610")) {
      await db
        .from("business_profiles")
        .update({ phone_validity: "opted_out" })
        .eq("id", opts.profileId);
    }
  }

  await pingSlack(result.success ? "Results link texted." : "Results text FAILED, check logs.");

  return { stored: true, smsSent: result.success };
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
