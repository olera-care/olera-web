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
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";

// v8.10.8: added "not_interested" — admin's "they said no thanks" path.
// Routes to handleClassifyReply -> not_interested transition (same as
// the Stop Outreach overflow's Not interested option, but reachable
// inline from the same Log Reply modal).
export type ReplyClassification =
  | "keep_emailing"
  | "wants_meeting"
  | "already_booked"
  | "committed"
  | "not_interested";

interface Props {
  organizationName: string;
  /** Banner copy varies between email-reply and got-callback contexts. */
  source: "email_reply" | "callback";
  /**
   * v9.0 Phase 2 Tier 3.6: row kind. When 'provider', the "They're
   * sharing with students" outcome (which graduates a stakeholder to
   * Partner) is hidden — providers convert to Clients via T&C/Stripe
   * signal, not via admin classification. Defaults to stakeholder.
   */
  rowKind?: "provider" | "stakeholder";
  onCancel: () => void;
  /**
   * Called for keep_emailing | wants_meeting | already_booked |
   * not_interested. The `committed` path is dispatched via
   * onChooseCommitted so the parent can mount its own MarkPartnerModal
   * flow with evidence capture.
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
  rowKind = "stakeholder",
  onCancel,
  onSubmit,
  onChooseCommitted,
}: Props) {
  const isProvider = rowKind === "provider";
  const [choice, setChoice] = useState<ReplyClassification | null>(null);
  const [notes, setNotes] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // v8.10.7: title is universal — "Log reply" is the single verb across
  // email replies, voicemails, and callbacks. The source param still
  // distinguishes touchpoint type on the server, but admins see one
  // consistent prompt.
  const sourceLabel = "What did they say?";
  void source;

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
    <LogModalShell
      title={sourceLabel}
      subtitle={organizationName}
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
            disabled={submitting || !choice}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : choice === "committed" ? "Continue →" : "Save"}
          </button>
        </>
      }
    >
      {/* v8.10.7: short reminder before the radio options. Reinforces
          the inbox-triage workflow — admin checks Gmail and voicemail
          first, then comes here to pick what happened. */}
      <p className="rounded-md bg-blue-50/60 px-3 py-2 text-xs text-blue-900">
        Check Gmail and voicemail first, then pick what happened below.
      </p>

      <div className="space-y-1.5">
            <ChoiceCard
              active={choice === "keep_emailing"}
              onSelect={() => setChoice("keep_emailing")}
              label="They replied"
              blurb="Generic reply or question. The auto-cadence stops; you'll handle replies through Gmail from here."
              tone="neutral"
            />
            <ChoiceCard
              active={choice === "wants_meeting"}
              onSelect={() => setChoice("wants_meeting")}
              label="They want to meet"
              blurb="You'll coordinate a time over email. Row moves to Meetings."
              tone="warn"
            />
            <ChoiceCard
              active={choice === "already_booked"}
              onSelect={() => setChoice("already_booked")}
              label="Meeting is booked"
              blurb="Calendly auto-booked it, or you already added it to your calendar. Row moves to Meetings."
              tone="ok"
            />
            {!isProvider && (
              <ChoiceCard
                active={choice === "committed"}
                onSelect={() => setChoice("committed")}
                label="They're sharing with students"
                blurb="They committed. Row becomes a Partner; we'll capture evidence and queue seasonal check-ins."
                tone="ok"
              />
            )}
            <ChoiceCard
              active={choice === "not_interested"}
              onSelect={() => setChoice("not_interested")}
              label="They said no thanks"
              blurb="Polite decline. Row closes as Not interested; cadence stops and they leave the active workflow."
              tone="danger"
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
    </LogModalShell>
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
  tone: "ok" | "neutral" | "warn" | "danger";
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
      : tone === "danger"
      ? active
        ? "border-red-400 bg-red-50"
        : "border-gray-200 hover:border-red-300 hover:bg-red-50/30"
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
