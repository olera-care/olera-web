"use client";

/**
 * Pre-Flight Outcome Modal (formerly CallForEmailModal).
 *
 * One modal, six outcomes — the admin clicks Call to Confirm, picks the
 * outcome that happened, and the modal dispatches the right action. The
 * verification gate in `verification-state.ts` reads the resulting
 * touchpoints + research_data.pre_flight_overridden flag to decide whether
 * Launch Outreach unlocks.
 *
 * Outcomes
 * --------
 * - Confirmed Contact Information  → log_research_call (connected + verified)
 *                                    Pre-Flight passes immediately.
 * - No Answer                      → log_research_call (no_answer)
 *                                    Prospect stays in Pre-Flight.
 * - Voicemail                      → log_research_call (voicemail)
 *                                    Prospect stays in Pre-Flight.
 * - Wrong Number                   → log_research_call (wrong_number)
 *                                    Prospect stays in Pre-Flight, research required.
 * - Not Interested                 → log_call_outcome (connected_not_interested)
 *                                    Row closes (status → not_interested).
 * - Override Pre-Flight            → override_pre_flight
 *                                    Sets research_data.pre_flight_overridden = true,
 *                                    emits a note_added touchpoint for audit.
 *
 * All six outcomes are single-click — no engagement panel, no inline
 * contact form (Decision Maker now lives in the Research Card; admin
 * captures it there during research). Optional notes field below the
 * outcome buttons for free-text context.
 *
 * Visual: same LogModalShell + StatusCard pattern as LogCallOutcomeModal
 * and ReplyClassifierModal so admins recognize the shape.
 */

import { useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import type { DrawerContext } from "@/lib/student-outreach/types";
import Input from "@/components/ui/Input";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

type Outcome =
  | "confirmed"
  | "no_answer"
  | "voicemail"
  | "wrong_number"
  | "not_interested"
  | "override";

interface OutcomeChoice {
  key: Outcome;
  label: string;
  blurb: string;
  /** Visually distinguishes the unlock-the-gate outcomes (green) from
   *  the keep-in-pre-flight outcomes (neutral) and the override (amber). */
  tone: "unlock" | "stay" | "override" | "close";
}

const OUTCOME_CHOICES: OutcomeChoice[] = [
  {
    key: "confirmed",
    label: "Confirmed Contact Information",
    blurb: "Reached someone. Verified email, phone, decision maker. Pre-Flight passes.",
    tone: "unlock",
  },
  {
    key: "no_answer",
    label: "No Answer",
    blurb: "Nobody answered. Prospect stays in Pre-Flight — try again later.",
    tone: "stay",
  },
  {
    key: "voicemail",
    label: "Voicemail",
    blurb: "Left a voicemail. Prospect stays in Pre-Flight — try again later.",
    tone: "stay",
  },
  {
    key: "wrong_number",
    label: "Wrong Number",
    blurb: "Contact info is invalid. Research a new number before retrying.",
    tone: "stay",
  },
  {
    key: "not_interested",
    label: "Not Interested",
    blurb: "They don't want information. Closes the row — no outreach.",
    tone: "close",
  },
  {
    key: "override",
    label: "Override Pre-Flight",
    blurb:
      "Bypass verification (already verified elsewhere, trusted source, leadership exception). Launch unlocks.",
    tone: "override",
  },
];

interface Props {
  organizationName: string;
  phone: string | null;
  action: ActionFn;
  onCancel: () => void;
  onDone: () => void;
  setError: (msg: string | null) => void;
}

export function CallForEmailModal({
  organizationName,
  phone,
  action,
  onCancel,
  onDone,
  setError,
}: Props) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async () => {
    if (!outcome) return;
    setSaving(true);
    setLocalError(null);
    setError(null);
    try {
      const trimmedNotes = notes.trim() || null;
      switch (outcome) {
        case "confirmed":
          await action("log_research_call", {
            outcome: "connected",
            verified: true,
            notes: trimmedNotes,
          });
          break;
        case "no_answer":
          await action("log_research_call", {
            outcome: "no_answer",
            notes: trimmedNotes,
          });
          break;
        case "voicemail":
          await action("log_research_call", {
            outcome: "voicemail",
            notes: trimmedNotes,
          });
          break;
        case "wrong_number":
          await action("log_research_call", {
            outcome: "wrong_number",
            notes: trimmedNotes,
          });
          break;
        case "not_interested":
          // Reuses the existing log_call_outcome path so the row
          // transitions to status=not_interested and the cadence is
          // superseded. One real phone call = one timeline entry.
          await action("log_call_outcome", {
            outcome: "connected_not_interested",
            notes: trimmedNotes,
          });
          break;
        case "override":
          await action("override_pre_flight", { notes: trimmedNotes });
          break;
      }
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to log outcome";
      setLocalError(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const subtitle = (
    <>
      {organizationName}
      {phone && (
        <>
          {" · "}
          <a href={`tel:${phone}`} className="text-primary-700 hover:underline">
            📞 {phone}
          </a>
        </>
      )}
    </>
  );

  const submitLabel =
    outcome === "override"
      ? "Override Pre-Flight"
      : outcome === "not_interested"
        ? "Close prospect"
        : "Log call";

  return (
    <LogModalShell
      title="Log Pre-Flight outcome"
      subtitle={subtitle}
      error={localError}
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
            disabled={saving || !outcome}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Logging…" : submitLabel}
          </button>
        </>
      }
    >
      <div className="space-y-1.5">
        {OUTCOME_CHOICES.map((opt) => (
          <StatusCard
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
        <Input
          as="textarea"
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            outcome === "confirmed"
              ? "What did the provider confirm? Anything useful for outreach copy?"
              : outcome === "override"
                ? "Why are you overriding (audit trail)?"
                : outcome === "not_interested"
                  ? "What did they say? Useful for future re-engage decisions."
                  : "Context for this attempt."
          }
          rows={3}
          size="sm"
        />
      </div>
    </LogModalShell>
  );
}

function StatusCard({
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
  tone: "unlock" | "stay" | "override" | "close";
}) {
  const activeBorder =
    tone === "unlock"
      ? "border-primary-500 bg-primary-50"
      : tone === "override"
        ? "border-amber-500 bg-amber-50"
        : tone === "close"
          ? "border-gray-500 bg-gray-100"
          : "border-gray-400 bg-gray-50";
  const idleHover =
    tone === "unlock"
      ? "hover:border-primary-300 hover:bg-primary-50/30"
      : tone === "override"
        ? "hover:border-amber-300 hover:bg-amber-50/30"
        : "hover:border-gray-400 hover:bg-gray-50";
  const dotActive =
    tone === "unlock"
      ? "border-primary-600 bg-primary-600"
      : tone === "override"
        ? "border-amber-600 bg-amber-600"
        : "border-gray-600 bg-gray-600";
  return (
    <button
      onClick={onSelect}
      type="button"
      className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
        active ? activeBorder : `border-gray-200 ${idleHover}`
      }`}
    >
      <span
        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
          active ? dotActive : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        {active && (
          <span
            className={`block h-full w-full rounded-full border-2 border-white ${
              tone === "unlock"
                ? "bg-primary-600"
                : tone === "override"
                  ? "bg-amber-600"
                  : "bg-gray-600"
            }`}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-600">{blurb}</span>
      </span>
    </button>
  );
}
