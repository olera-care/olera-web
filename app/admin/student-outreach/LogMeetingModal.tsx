"use client";

/**
 * LogMeetingModal — v8.10.28.
 *
 * Universal Meetings-tab modal covering the full meeting lifecycle:
 *
 *   Before the meeting:
 *     - Still finding a time → flag_wants_meeting (note_added,
 *       reason="meeting_in_flight"). Card pill: "Finding a time".
 *     - On the calendar       → mark_meeting_scheduled with optional
 *       date. Card pill: "Booked · <date>".
 *
 *   After the meeting:
 *     - They're sharing it    → closes this modal and opens
 *       MarkPartnerModal so admin can capture evidence + graduate
 *       the row to active_partner. Row leaves Meetings → Partners.
 *     - Need to email more    → mark_meeting_followup (meeting_held
 *       outcome=needs_followup + note_added reason="post_meeting_followup").
 *       Row leaves Meetings → Replies as needs_followup.
 *
 * The modal pre-populates with the row's current state so admin can
 * tweak the date / notes without re-entering everything. The CTA
 * label on the card flips based on whether the meeting is booked
 * yet ("Log meeting" vs "Complete"), but the same modal handles
 * both flows — the admin can always pick any of the four options.
 */

import { useState } from "react";

export type MeetingStatus =
  | "finding_time"
  | "booked"
  | "done_partner"
  | "done_followup";

interface Props {
  organizationName: string;
  contactName: string | null;
  /** Pre-fill the radio with the row's current state. */
  initialStatus: MeetingStatus;
  /** Pre-fill the datetime input (datetime-local format YYYY-MM-DDTHH:mm). */
  initialMeetingAt?: string;
  onCancel: () => void;
  onSubmit: (
    status: MeetingStatus,
    payload: { notes: string; meeting_at?: string | null },
  ) => Promise<void>;
}

export function LogMeetingModal({
  organizationName,
  contactName,
  initialStatus,
  initialMeetingAt,
  onCancel,
  onSubmit,
}: Props) {
  const [status, setStatus] = useState<MeetingStatus>(initialStatus);
  const [meetingAt, setMeetingAt] = useState(initialMeetingAt ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notesRequired = status === "done_followup";
  const notesPlaceholder =
    status === "done_followup"
      ? "What's left to do over email? (Required — so the team knows what to send next.)"
      : status === "done_partner"
        ? "Anything to remember? You'll add evidence on the next step."
        : "Permission notes, materials to send, ongoing thread context — anything to remember.";

  const submitLabel =
    status === "done_partner"
      ? "Next → mark Partner"
      : status === "done_followup"
        ? "Send to Replies"
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
      await onSubmit(status, {
        notes: notes.trim(),
        meeting_at:
          status === "booked" && meetingAt
            ? new Date(meetingAt).toISOString()
            : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{titleText}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {contactName ? `${contactName} · ${organizationName}` : organizationName}
          </p>
        </header>

        <div className="space-y-3 px-6 py-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

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
            <StatusCard
              active={status === "done_partner"}
              onSelect={() => setStatus("done_partner")}
              label="Done — they're sharing with students"
              blurb="Meeting went great. They'll post, share, or hand out flyers."
            />
            <StatusCard
              active={status === "done_followup"}
              onSelect={() => setStatus("done_followup")}
              label="Done — needs more email"
              blurb="Meeting happened, but we still need to follow up over email."
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
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
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
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : submitLabel}
          </button>
        </footer>
      </div>
    </div>
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
