"use client";

/**
 * Mark-as-Partner graduation modal.
 *
 * Captures evidence type + notes and submits as `mark_partner` action.
 * Visible from `engaged` and `meeting_scheduled` stages (and from More
 * menu for evidence-based jumps from earlier stages).
 */

import { useEffect, useState } from "react";
import type { DistributionEvidence } from "@/lib/student-outreach/types";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";

interface Props {
  organizationName: string;
  onCancel: () => void;
  onConfirm: (payload: { evidence: DistributionEvidence; evidence_notes: string }) => void | Promise<void>;
}

const EVIDENCE_OPTIONS: Array<{ value: DistributionEvidence; label: string; hint: string }> = [
  { value: "explicit_email", label: "They explicitly said yes — in writing", hint: "Email reply or written confirmation" },
  { value: "explicit_verbal", label: "They explicitly said yes — verbally", hint: "Call, voicemail, meeting" },
  { value: "observed_external", label: "I observed them sharing externally", hint: "IG story, listserv thread, dept newsletter" },
  { value: "self_reported", label: "They told me they shared it", hint: "After-the-fact confirmation" },
];

export function MarkPartnerModal({ organizationName, onCancel, onConfirm }: Props) {
  const [evidence, setEvidence] = useState<DistributionEvidence>("explicit_verbal");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <LogModalShell
      title="Mark as Partner"
      subtitle={
        <>
          Graduating <strong>{organizationName}</strong>. We&apos;ll log the
          evidence and queue the first seasonal check-in.
        </>
      }
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
            onClick={async () => {
              setSubmitting(true);
              try {
                await onConfirm({ evidence, evidence_notes: notes.trim() });
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Mark as Partner"}
          </button>
        </>
      }
    >
      <p className="text-xs font-medium text-gray-700">How do you know they&apos;re distributing?</p>
      <div className="space-y-1.5">
        {EVIDENCE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 ${
              evidence === opt.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="evidence"
              className="mt-0.5"
              checked={evidence === opt.value}
              onChange={() => setEvidence(opt.value)}
            />
            <span className="flex-1">
              <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
              <span className="block text-xs text-gray-500">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder='e.g. "Saw on @berkeleypremed IG story 5/4"'
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
      </label>
    </LogModalShell>
  );
}
