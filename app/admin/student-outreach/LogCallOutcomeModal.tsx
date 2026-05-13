"use client";

/**
 * v9.0 Phase 7 Commit G: LogCallOutcomeModal.
 *
 * Opens from a Calls-tab row click. Admin picks one of seven outcomes;
 * the parent handles routing (see [id]/route.ts handleLogCall):
 *
 *   No answer            → mark call task complete, row leaves Calls until
 *                          next phone day
 *   Left voicemail       → mark call task complete, row → Replies as
 *                          awaiting_callback (kind=voicemail)
 *   Promised callback    → mark call task complete, →engaged, row →
 *                          Replies awaiting_callback (kind=promised)
 *   Interested           → →engaged, supersede future call + email tasks
 *   Mark as Partner ★    → expands inline with PartnerEvidencePanel; submit
 *                          fires log_call(outcome=convert_to_partner) THEN
 *                          mark_partner with the evidence payload. Replaces
 *                          the previous chained MarkPartnerModal flow.
 *   Not interested       → →not_interested (closes; cancels pending tasks)
 *   Wrong number         → →wrong_contact (closes; cancels pending tasks)
 *
 * The partner branch is fully self-contained — onSubmit gains an
 * optional partner-evidence payload that the parent passes through to
 * the mark_partner action after the log_call action lands.
 */

import { useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import {
  PartnerEvidencePanel,
  DEFAULT_PARTNER_EVIDENCE,
  type PartnerEvidence,
} from "@/components/admin/medjobs/PartnerEvidencePanel";
import type { DistributionEvidence } from "@/lib/student-outreach/types";

interface Props {
  organizationName: string;
  contactName: string | null;
  contactPhone: string | null;
  /**
   * v9.0 Phase 2 Tier 3.6: row kind. When 'provider', the
   * "Mark as Partner ★" outcome is hidden — providers convert to
   * Clients via the T&C/Stripe signal, not via admin click. Defaults
   * to stakeholder.
   */
  rowKind?: "provider" | "stakeholder";
  onCancel: () => void;
  /**
   * Called on submit. When the admin picked the partner outcome,
   * `partner` carries the evidence payload — parent should fire
   * mark_partner immediately after log_call so both lands in one
   * user-facing action.
   */
  onSubmit: (
    outcome: string,
    notes: string,
    partner?: PartnerEvidence,
  ) => Promise<void>;
}

interface Outcome {
  key: string;
  label: string;
  blurb: string;
}

const DIDNT_REACH: Outcome[] = [
  {
    key: "no_answer",
    label: "No answer",
    blurb: "Marks this call complete. Row reappears in Calls on the next scheduled phone day.",
  },
  {
    key: "voicemail",
    label: "Left a voicemail",
    blurb: "Row moves to Replies as awaiting callback. Future call days still fire on schedule.",
  },
];

const REACHED_THEM: Outcome[] = [
  {
    key: "promised_callback",
    label: "Promised to call back",
    blurb: "Row moves to Replies as awaiting callback. Future call days still fire on schedule.",
  },
  {
    key: "connected_engaged",
    label: "Interested",
    blurb: "Stops the email and call cadence. Use the reply-classifier next.",
  },
  {
    key: "convert_to_partner",
    label: "Mark as Partner ★",
    blurb: "They committed to sharing with students. Capture the evidence below.",
  },
  {
    key: "convert_to_client",
    label: "Became a Client ✓",
    blurb: "They committed to the caregiver-hiring pilot. Marks the provider as a Client and unlocks Partner Prospects for catchment Sites.",
  },
  {
    key: "connected_not_interested",
    label: "Not interested",
    blurb: "Closes the row. Cancels remaining email and call tasks.",
  },
  {
    key: "wrong_number",
    label: "Wrong number",
    blurb: "Marks the contact unreachable on this number. Closes the row.",
  },
];

export function LogCallOutcomeModal({
  organizationName,
  contactName,
  contactPhone,
  rowKind = "stakeholder",
  onCancel,
  onSubmit,
}: Props) {
  // v9 final: provider rows can convert to Client; stakeholder rows
  // can convert to Partner. They're mutually exclusive — neither
  // appears on the wrong kind.
  const reachedThemFiltered = REACHED_THEM.filter((o) => {
    if (o.key === "convert_to_partner") return rowKind !== "provider";
    if (o.key === "convert_to_client") return rowKind === "provider";
    return true;
  });
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState<DistributionEvidence>(DEFAULT_PARTNER_EVIDENCE);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPartner = outcome === "convert_to_partner";

  const submit = async () => {
    if (!outcome) {
      setError("Pick an outcome.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        outcome,
        notes.trim(),
        isPartner ? { evidence, evidence_notes: evidenceNotes.trim() } : undefined,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle = (
    <>
      {organizationName}
      {contactName && ` · ${contactName}`}
      {contactPhone && ` · ${contactPhone}`}
    </>
  );

  return (
    <LogModalShell
      title="Log call outcome"
      subtitle={subtitle}
      error={error}
      onCancel={onCancel}
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !outcome}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
              isPartner
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {submitting
              ? isPartner
                ? "Saving…"
                : "Logging…"
              : isPartner
                ? "Mark as Partner"
                : "Log outcome"}
          </button>
        </>
      }
    >
      <OutcomeGroup
        title="Didn't reach them"
        outcomes={DIDNT_REACH}
        selected={outcome}
        onSelect={setOutcome}
      />
      <OutcomeGroup
        title="Reached them"
        outcomes={reachedThemFiltered}
        selected={outcome}
        onSelect={setOutcome}
      />
      <label className="block pt-2">
        <span className="mb-1 block text-xs font-medium text-gray-600">
          Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What was said? Any next-step context for the team."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
      </label>
      {isPartner && (
        <PartnerEvidencePanel
          evidence={evidence}
          notes={evidenceNotes}
          onEvidenceChange={setEvidence}
          onNotesChange={setEvidenceNotes}
        />
      )}
    </LogModalShell>
  );
}

function OutcomeGroup({
  title,
  outcomes,
  selected,
  onSelect,
}: {
  title: string;
  outcomes: Outcome[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <div className="space-y-1.5">
        {outcomes.map((o) => {
          const active = selected === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onSelect(o.key)}
              className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                active
                  ? "border-gray-700 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active ? "border-gray-900 bg-gray-900" : "border-gray-300"
                }`}
                aria-hidden
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900">{o.label}</span>
                <span className="mt-0.5 block text-xs text-gray-600">{o.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
