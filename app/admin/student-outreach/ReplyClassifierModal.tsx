"use client";

/**
 * ReplyClassifierModal — v8.
 *
 * Single triage modal shared by:
 *   - Replies tab "They replied" button on a mid_cadence row
 *   - Replies tab "Got a callback" button on an awaiting_callback row
 *
 * Four classifications drive different downstream actions:
 *   keep_emailing   → log_email_replied (engaged + supersede emails)
 *   wants_meeting   → flag_wants_meeting (note_added meeting_in_flight)
 *   already_booked  → mark_meeting_scheduled with optional date input
 *   committed       → mark_partner with evidence
 *
 * For "already_booked" the modal grows a datetime input. For "committed"
 * we hand off to the existing MarkPartnerModal flow via onChooseCommitted.
 */

import { useState } from "react";

export type ReplyClassification = "keep_emailing" | "wants_meeting" | "already_booked" | "committed";

interface Props {
  organizationName: string;
  /** Banner copy varies between email-reply and got-callback contexts. */
  source: "email_reply" | "callback";
  onCancel: () => void;
  /**
   * Called for keep_emailing | wants_meeting | already_booked. The
   * `committed` path is dispatched via onChooseCommitted so the parent
   * can mount its own MarkPartnerModal flow.
   */
  onSubmit: (
    classification: Exclude<ReplyClassification, "committed">,
    payload: { notes: string; meeting_at?: string | null },
  ) => Promise<void>;
  onChooseCommitted: () => void;
}

export function ReplyClassifierModal({
  organizationName,
  source,
  onCancel,
  onSubmit,
  onChooseCommitted,
}: Props) {
  const [choice, setChoice] = useState<ReplyClassification | null>(null);
  const [notes, setNotes] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceLabel =
    source === "email_reply" ? "What did they say?" : "What did they say on the callback?";

  const submit = async () => {
    if (!choice) {
      setError("Pick what they said.");
      return;
    }
    if (choice === "committed") {
      onChooseCommitted();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(choice, {
        notes: notes.trim(),
        meeting_at: choice === "already_booked" && meetingAt
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
          <h3 className="text-base font-semibold text-gray-900">{sourceLabel}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {organizationName}
          </p>
        </header>

        <div className="space-y-2 px-6 py-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="space-y-1.5">
            <ChoiceCard
              active={choice === "keep_emailing"}
              onSelect={() => setChoice("keep_emailing")}
              label="They replied — keep emailing"
              blurb="Generic reply (questions, asking for info). Cancels the cadence so the cron stops sending."
              tone="neutral"
            />
            <ChoiceCard
              active={choice === "wants_meeting"}
              onSelect={() => setChoice("wants_meeting")}
              label="They want a meeting"
              blurb="Coordinating a time over email. Row moves to Meetings tab as 'Finding a time'."
              tone="warn"
            />
            <ChoiceCard
              active={choice === "already_booked"}
              onSelect={() => setChoice("already_booked")}
              label="A meeting is already booked"
              blurb="Calendly auto-booked, or you've already added it to the calendar. Row moves to Meetings."
              tone="ok"
            />
            <ChoiceCard
              active={choice === "committed"}
              onSelect={() => setChoice("committed")}
              label="They committed to sharing with students"
              blurb="They're an Active Partner. We'll capture evidence and queue seasonal check-ins."
              tone="ok"
            />
          </div>

          {choice === "already_booked" && (
            <label className="block pt-2">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Meeting date (optional)
              </span>
              <input
                type="datetime-local"
                value={meetingAt}
                onChange={(e) => setMeetingAt(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-gray-500">
                You can leave blank — we&rsquo;ll just mark it scheduled.
              </span>
            </label>
          )}

          {choice !== "committed" && (
            <label className="block pt-2">
              <span className="mb-1 block text-xs font-medium text-gray-600">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="What did they say? Any context for next steps."
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </label>
          )}
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
            disabled={submitting || !choice}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : choice === "committed" ? "Continue →" : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ChoiceCard({
  active,
  onSelect,
  label,
  blurb,
  tone,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  blurb: string;
  tone: "ok" | "neutral" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? active
        ? "border-emerald-500 bg-emerald-50"
        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
      : tone === "warn"
      ? active
        ? "border-amber-500 bg-amber-50"
        : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
      : active
      ? "border-gray-700 bg-gray-50"
      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${toneClass}`}
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
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-600">{blurb}</span>
      </span>
    </button>
  );
}
