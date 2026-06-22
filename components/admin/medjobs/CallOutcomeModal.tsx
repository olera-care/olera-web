"use client";

/**
 * Unified call-outcome modal. One presentational shell used for BOTH the
 * pre-flight verify call (Config A) and the cadence "call to follow up"
 * (Config B). Always shows the call script (design C) at the top, then the
 * config's outcome cards, then an optional notes field. The parent supplies
 * the outcome set and handles dispatch via onSubmit(outcomeKey, notes) — so
 * the resolve/queue/activation behavior lives with each caller, not here.
 */

import { useState, type ReactNode } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import { CallScriptBlock } from "@/components/admin/medjobs/CallScriptBlock";

export type OutcomeTone = "happy" | "neutral" | "close";

export interface OutcomeChoice {
  key: string;
  label: string;
  blurb: string;
  tone: OutcomeTone;
}

interface Props {
  title: string;
  subtitle?: ReactNode;
  scriptLabel: string;
  /** The day's call script. Null hides the block (e.g. no script on file). */
  script: string | null;
  outcomes: OutcomeChoice[];
  /** Config B: a note alone can satisfy + resolve the call (no outcome needed). */
  allowNotesOnly?: boolean;
  notesPlaceholder?: string;
  onCancel: () => void;
  /** Dispatch happens in the parent. outcomeKey is null when logging a
   *  note-only resolve (allowNotesOnly). */
  onSubmit: (outcomeKey: string | null, notes: string | null) => Promise<void>;
}

export function CallOutcomeModal({
  title,
  subtitle,
  scriptLabel,
  script,
  outcomes,
  allowNotesOnly = false,
  notesPlaceholder = "Context for this call — what was said, the next step.",
  onCancel,
  onSubmit,
}: Props) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    outcome !== null || (allowNotesOnly && notes.trim().length > 0);

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(outcome, notes.trim() || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log call");
      setSaving(false);
    }
  };

  return (
    <LogModalShell
      title={title}
      subtitle={subtitle}
      error={error}
      onCancel={onCancel}
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !canSubmit}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Logging…" : "Log call"}
          </button>
        </>
      }
    >
      {script && <CallScriptBlock label={scriptLabel} script={script} />}

      <div className="space-y-1.5">
        {outcomes.map((opt) => (
          <OutcomeCard
            key={opt.key}
            active={outcome === opt.key}
            onSelect={() => setOutcome(opt.key)}
            label={opt.label}
            blurb={opt.blurb}
            tone={opt.tone}
          />
        ))}
      </div>

      <div className="pt-1">
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Notes {allowNotesOnly ? "(a note alone logs the call)" : "(optional)"}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={notesPlaceholder}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
      </div>
    </LogModalShell>
  );
}

function OutcomeCard({
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
  tone: OutcomeTone;
}) {
  const activeBorder =
    tone === "happy"
      ? "border-primary-500 bg-primary-50"
      : tone === "close"
        ? "border-gray-500 bg-gray-100"
        : "border-gray-400 bg-gray-50";
  const dot =
    tone === "happy" ? "bg-primary-600" : tone === "close" ? "bg-gray-600" : "bg-gray-600";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
        active ? activeBorder : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          active ? "border-transparent" : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        {active && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-600">{blurb}</span>
      </span>
    </button>
  );
}
