"use client";

/**
 * LogMeetingModal — v8.10.19.
 *
 * Universal Meetings-tab CTA. Replaces the previous state-specific
 * buttons ("Booked it" on in_flight rows, "Make Partner ★" on
 * scheduled rows) with a single "Log Meeting" entry point that opens
 * this modal.
 *
 * Two outcomes:
 *   - Finding a time → flag_wants_meeting (note_added with reason
 *                      meeting_in_flight). Row appears in Meetings
 *                      as "Finding a time".
 *   - Booked         → mark_meeting_scheduled with optional date.
 *                      Row appears in Meetings as "Booked · <date>".
 *
 * Both also accept optional follow-up notes — admin's reminders for
 * permission follow-up, materials to send, ongoing email threads, etc.
 *
 * Modal pre-populates with the row's current meeting state so admin
 * can update the date or notes without re-entering everything.
 */

import { useState } from "react";

export type MeetingStatus = "finding_time" | "booked";

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

  const submit = async () => {
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
          <h3 className="text-base font-semibold text-gray-900">Log meeting</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {contactName ? `${contactName} · ${organizationName}` : organizationName}
          </p>
        </header>

        <div className="space-y-3 px-6 py-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="space-y-1.5">
            <StatusCard
              active={status === "finding_time"}
              onSelect={() => setStatus("finding_time")}
              label="Finding a time"
              blurb="Coordinating over email — no date locked in yet."
            />
            <StatusCard
              active={status === "booked"}
              onSelect={() => setStatus("booked")}
              label="Booked"
              blurb="On the calendar (Calendly, manual invite, or already added)."
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
              Follow-up notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Permission follow-up, materials to send, ongoing thread context — anything you want to remember after the meeting."
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
            {submitting ? "Saving…" : "Save"}
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
