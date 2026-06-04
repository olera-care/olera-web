"use client";

/**
 * v9.0 Phase 7 Commit G: LogMeetingModal.
 *
 * Universal Meetings-tab modal covering the full meeting lifecycle:
 *
 *   Before the meeting:
 *     - Still finding a time → flag_wants_meeting (note_added,
 *       reason="meeting_in_flight").
 *     - On the calendar      → mark_meeting_scheduled with optional date.
 *
 *   After the meeting:
 *     - Mark as Partner ★    → expands inline with PartnerEvidencePanel;
 *       submit fires mark_partner with the evidence payload. Replaces
 *       the previous chained MarkPartnerModal flow.
 *     - Need to email more   → mark_meeting_followup. Row leaves
 *       Meetings → Replies as needs_followup.
 *
 * The modal pre-populates with the row's current state so admin can
 * tweak date/notes without re-entering everything.
 */

import { useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import {
  PartnerEvidencePanel,
  DEFAULT_PARTNER_EVIDENCE,
  type PartnerEvidence,
} from "@/components/admin/medjobs/PartnerEvidencePanel";
import type { DistributionEvidence } from "@/lib/student-outreach/types";

// C3: not_a_fit is a UI-level choice key only — dispatches to the
// existing mark_not_interested action on submit.
// P3: done_client is a provider-only UI-level choice key — dispatches
// to the existing make_client action, writing
// business_profiles.metadata.interview_terms_accepted_at and unlocking
// Partner Prospects for catchment Sites. Parallels done_partner for
// stakeholders.
// P6: no_show is a UI-level choice key — dispatches flag_wants_meeting
// with payload.no_show=true so the route handler emits the existing
// meeting_no_show touchpoint AND keeps meeting_state in_flight for
// rescheduling. No new backend action, no new touchpoint type — the
// meeting_no_show touchpoint already existed but was unused.
export type MeetingStatus =
  | "finding_time"
  | "booked"
  | "done_partner"
  | "done_client"
  | "done_followup"
  | "not_a_fit"
  | "no_show";

interface Props {
  organizationName: string;
  contactName: string | null;
  /** Pre-fill the radio with the row's current state. */
  initialStatus: MeetingStatus;
  /** Pre-fill the datetime input (datetime-local format YYYY-MM-DDTHH:mm). */
  initialMeetingAt?: string;
  /**
   * Row kind. When 'provider', the "Mark as Partner" outcome is hidden —
   * providers convert to Clients via the Call modal's convert_to_client
   * outcome (which writes interview_terms_accepted_at) or via T&C/Stripe
   * signal, not via mark_partner (which is the stakeholder-conversion
   * path that doesn't unlock Partner Prospects for providers). Mirrors
   * the ReplyClassifierModal gating at line 176. Defaults to stakeholder.
   */
  rowKind?: "provider" | "stakeholder";
  onCancel: () => void;
  /**
   * Called on submit. When the admin picked done_partner, `partner`
   * carries the evidence payload — parent should fire mark_partner
   * with that payload (no separate meeting action is needed for the
   * partner branch — the conversion is the log).
   */
  onSubmit: (
    status: MeetingStatus,
    payload: { notes: string; meeting_at?: string | null },
    partner?: PartnerEvidence,
  ) => Promise<void>;
}

export function LogMeetingModal({
  organizationName,
  contactName,
  initialStatus,
  initialMeetingAt,
  rowKind = "stakeholder",
  onCancel,
  onSubmit,
}: Props) {
  const isProvider = rowKind === "provider";
  const [status, setStatus] = useState<MeetingStatus>(initialStatus);
  const [meetingAt, setMeetingAt] = useState(initialMeetingAt ?? "");
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState<DistributionEvidence>(DEFAULT_PARTNER_EVIDENCE);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPartner = status === "done_partner";
  const isClient = status === "done_client";
  const isNotAFit = status === "not_a_fit";
  const isNoShow = status === "no_show";
  const notesRequired = status === "done_followup";
  const notesPlaceholder =
    status === "done_followup"
      ? "What's left to do over email? (Required — so the team knows what to send next.)"
      : isPartner
        ? "Anything else worth remembering? Evidence goes in the panel below."
        : isNotAFit
          ? "Optional. What made it not a fit? Useful context for future relationships."
          : "Permission notes, materials to send, ongoing thread context — anything to remember.";

  const submitLabel = isPartner
    ? "Mark as Partner"
    : isClient
      ? "Activate pilot"
      : status === "done_followup"
        ? "Send to Replies"
        : isNotAFit
          ? "Close as not a fit"
          : isNoShow
            ? "Log no-show"
            : "Save";

  const titleText =
    initialStatus === "booked" ? "Update or complete meeting" : "Log meeting";

  const submit = async () => {
    if (notesRequired && !notes.trim()) {
      setError("Add a quick note so the team knows what to follow up on.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        status,
        {
          notes: notes.trim(),
          meeting_at:
            status === "booked" && meetingAt
              ? new Date(meetingAt).toISOString()
              : null,
        },
        isPartner
          ? { evidence, evidence_notes: evidenceNotes.trim() }
          : undefined,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LogModalShell
      title={titleText}
      subtitle={contactName ? `${contactName} · ${organizationName}` : organizationName}
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
            disabled={submitting}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
              isPartner
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {submitting ? "Saving…" : submitLabel}
          </button>
        </>
      }
    >
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Before the meeting
          </p>
          <div className="space-y-1.5">
            <StatusCard
              active={status === "finding_time"}
              onSelect={() => setStatus("finding_time")}
              label="Still finding a time"
              blurb="Going back and forth over email — no date locked in yet."
            />
            <StatusCard
              active={status === "booked"}
              onSelect={() => setStatus("booked")}
              label="On the calendar"
              blurb="Date is set (Calendly, manual invite, or already added)."
            />
          </div>

          <p className="pt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
            After the meeting
          </p>
          <div className="space-y-1.5">
            {!isProvider && (
              <StatusCard
                active={status === "done_partner"}
                onSelect={() => setStatus("done_partner")}
                label="Mark as Partner ★"
                blurb="They committed to sharing with students. Capture the evidence below."
              />
            )}
            {isProvider && (
              <StatusCard
                active={status === "done_client"}
                onSelect={() => setStatus("done_client")}
                label="Activate pilot on their behalf 🎉"
                blurb="They verbally agreed to the pilot. Activates Pilot Active for 90 days, sets pilot terms accepted (via admin), and unlocks Partner Prospects for catchment Sites."
              />
            )}
            <StatusCard
              active={status === "done_followup"}
              onSelect={() => setStatus("done_followup")}
              label="Done — needs more email"
              blurb="Meeting happened, but we still need to follow up over email."
            />
            <StatusCard
              active={status === "not_a_fit"}
              onSelect={() => setStatus("not_a_fit")}
              label="Not a fit"
              blurb="Meeting happened, but they're not the right partner. Closes the row as Not interested; cancels pending tasks."
            />
            <StatusCard
              active={status === "no_show"}
              onSelect={() => setStatus("no_show")}
              label="No-show / cancelled — rescheduling"
              blurb="They didn't show up or cancelled at the last minute. Logs the no-show event and keeps the row in Meetings ready to re-book."
            />
          </div>

          {status === "booked" && (
            <label className="block pt-1">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Meeting date &amp; time (optional)
              </span>
              <input
                type="datetime-local"
                value={meetingAt}
                onChange={(e) => setMeetingAt(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-gray-500">
                Leave blank — we&rsquo;ll just mark it scheduled.
              </span>
            </label>
          )}

          <label className="block pt-1">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Notes {notesRequired ? <span className="text-red-600">*</span> : "(optional)"}
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={notesPlaceholder}
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

function StatusCard({
  active,
  onSelect,
  label,
  blurb,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  blurb: string;
}) {
  return (
    <button
      onClick={onSelect}
      type="button"
      className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
        active
          ? "border-emerald-500 bg-emerald-50"
          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
      }`}
    >
      <span
        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
          active ? "border-emerald-600 bg-emerald-600" : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        {active && (
          <span className="block h-full w-full rounded-full border-2 border-white bg-emerald-600" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-600">{blurb}</span>
      </span>
    </button>
  );
}
