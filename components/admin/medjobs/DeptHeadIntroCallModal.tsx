"use client";

/**
 * Department-Head pre-launch INTRO CALL modal.
 *
 * Dept heads are senior faculty (all Drs.); when a phone exists we place a
 * brief, courteous intro call BEFORE launching email outreach — introduce
 * ourselves + Dr. DuBose, confirm we have the right person/email, and let them
 * know concise info is on the way. This is NOT a gate: the admin can launch
 * regardless of whether the call connects (no answer / voicemail / skip).
 *
 * Reuses the shared LogModalShell + the `log_research_call` action (which logs
 * a call touchpoint WITHOUT advancing the row's stage), so the intro call shows
 * up in the timeline but the email sequence is still launched explicitly.
 * Deliberately slimmer than CallForEmailModal — no verification gate, no
 * override, no "wrong number / not interested" branches.
 */

import { useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import type { DrawerContext } from "@/lib/student-outreach/types";
import Input from "@/components/ui/Input";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

type Outcome = "connected" | "no_answer" | "voicemail";

const OUTCOMES: Array<{ key: Outcome; label: string; blurb: string }> = [
  {
    key: "connected",
    label: "Reached them",
    blurb: "Spoke with the department head (or their office). Introduced ourselves + Dr. DuBose.",
  },
  {
    key: "voicemail",
    label: "Left a voicemail",
    blurb: "Left a brief professional message that information is on the way.",
  },
  {
    key: "no_answer",
    label: "No answer",
    blurb: "Nobody picked up. Launch anyway — the intro email still goes out.",
  },
];

interface Props {
  organizationName: string;
  contactName: string | null;
  campusName?: string | null;
  phone: string | null;
  action: ActionFn;
  onCancel: () => void;
  onDone: () => void;
  setError: (msg: string | null) => void;
}

export function DeptHeadIntroCallModal({
  organizationName,
  contactName,
  campusName,
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
      // log_research_call records the call without advancing the stage — the
      // row still launches via the email sequence afterward.
      await action("log_research_call", { outcome, notes: notes.trim() || null });
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to log the intro call";
      setLocalError(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const subtitle = (
    <>
      {organizationName}
      {contactName ? ` · ${contactName}` : ""}
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

  const campus = campusName?.trim() || "your campus";

  return (
    <LogModalShell
      title="Intro call (recommended)"
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
            Skip
          </button>
          <button
            onClick={submit}
            disabled={saving || !outcome}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Logging…" : "Log intro call"}
          </button>
        </>
      }
    >
      <section className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Suggested script
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-gray-700">
          &ldquo;Hello, this is [your name], research assistant to Dr. Logan
          DuBose at Olera. I&apos;m reaching out about the Student Caregiver
          Program for {campus} students, which places pre-health students in paid
          caregiver roles with older adults. Before I send any details, are you
          the right person in the department to talk with, or is there a better
          contact?&rdquo;
        </p>
      </section>

      <div className="space-y-1.5">
        {OUTCOMES.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setOutcome(opt.key)}
            className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
              outcome === opt.key
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-primary-300 hover:bg-primary-50/30"
            }`}
          >
            <span
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                outcome === opt.key ? "border-primary-600 bg-primary-600" : "border-gray-300 bg-white"
              }`}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-gray-600">{opt.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="pt-1">
        <Input
          as="textarea"
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything useful from the call — right person, better email, timing…"
          rows={3}
          size="sm"
        />
      </div>
    </LogModalShell>
  );
}
