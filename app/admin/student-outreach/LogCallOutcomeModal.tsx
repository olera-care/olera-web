"use client";

/**
 * LogCallOutcomeModal — v8.
 *
 * Opens from a Calls-tab row click. The admin makes the call, then picks
 * one of six outcomes that route the row appropriately:
 *
 *   No answer            → cadence continues, row stays in Calls if more calls due
 *   Voicemail            → row moves to Replies as awaiting_callback
 *   Promised callback    → row moves to Replies as awaiting_callback (kind=promised)
 *   Connected — engaged  → row → engaged stage, supersedes pending emails
 *   Connected — not interested → row → not_interested
 *   Wrong number         → row → wrong_contact
 *
 * "Connected — booked a meeting" is intentionally omitted: from the
 * Connected — engaged state, admin clicks "They replied" → "Already
 * booked" via the standard reply-classifier flow. This keeps one path.
 */

import { useState } from "react";

interface Props {
  organizationName: string;
  contactName: string | null;
  contactPhone: string | null;
  onCancel: () => void;
  onSubmit: (outcome: string, notes: string) => Promise<void>;
}

const OUTCOMES: Array<{
  key: string;
  label: string;
  blurb: string;
  tone: "ok" | "neutral" | "warn" | "danger";
}> = [
  {
    key: "no_answer",
    label: "No answer",
    blurb: "Phone rang out. Cadence continues, next call queued automatically.",
    tone: "neutral",
  },
  {
    key: "voicemail",
    label: "Left a voicemail",
    blurb: "Logged the voicemail. Row moves to Replies — watch the inbox for callback or voicemail-to-email notifications.",
    tone: "neutral",
  },
  {
    key: "promised_callback",
    label: "They picked up — said they'd call back",
    blurb: "Row moves to Replies as 'awaiting callback' until they reach out.",
    tone: "neutral",
  },
  {
    key: "connected_engaged",
    label: "Connected — they're engaged",
    blurb: "We talked, they're interested. Stops the email cadence; use the reply-classifier next.",
    tone: "ok",
  },
  {
    key: "connected_not_interested",
    label: "Connected — not interested",
    blurb: "Closes the row. We won't email or call again unless re-opened.",
    tone: "warn",
  },
  {
    key: "wrong_number",
    label: "Wrong number",
    blurb: "Marks all known contacts as unreachable on this number. Add a new contact to re-attempt.",
    tone: "danger",
  },
];

export function LogCallOutcomeModal({
  organizationName,
  contactName,
  contactPhone,
  onCancel,
  onSubmit,
}: Props) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!outcome) {
      setError("Pick an outcome.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(outcome, notes.trim());
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
          <h3 className="text-base font-semibold text-gray-900">Log call outcome</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {organizationName}
            {contactName && ` · ${contactName}`}
            {contactPhone && ` · ${contactPhone}`}
          </p>
        </header>

        <div className="space-y-2 px-6 py-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="space-y-1.5">
            {OUTCOMES.map((o) => {
              const active = outcome === o.key;
              const toneClass =
                o.tone === "ok"
                  ? active
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                  : o.tone === "warn"
                  ? active
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
                  : o.tone === "danger"
                  ? active
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-red-300 hover:bg-red-50/30"
                  : active
                  ? "border-gray-700 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setOutcome(o.key)}
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
                    <span className="block text-sm font-medium text-gray-900">{o.label}</span>
                    <span className="mt-0.5 block text-xs text-gray-600">{o.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>

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
            disabled={submitting || !outcome}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log outcome"}
          </button>
        </footer>
      </div>
    </div>
  );
}
