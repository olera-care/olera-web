"use client";

/**
 * v9.0 Phase 7 Commit G: PartnerEvidencePanel — the evidence-type
 * radio group + notes textarea that captures how admin knows a
 * stakeholder has committed to distributing student profiles.
 *
 * Extracted from MarkPartnerModal so all four entry points share
 * one panel:
 *   - LogCallOutcomeModal     (when outcome = convert_to_partner)
 *   - ReplyClassifierModal    (when choice = committed)
 *   - LogMeetingModal         (when status = done_partner)
 *   - MarkPartnerModal        (the standalone Make Partner ★ overflow path)
 *
 * The first three embed this inline below their primary picker; the
 * last is a thin wrapper around LogModalShell + this panel for the
 * direct-conversion entry. Submit verb is "Mark as Partner" across
 * all four — context-specific labels like "Convert to partner" or
 * "Committed" are gone, replaced by a single canonical verb.
 */

import type { DistributionEvidence } from "@/lib/student-outreach/types";
import Input from "@/components/ui/Input";

export interface PartnerEvidence {
  evidence: DistributionEvidence;
  evidence_notes: string;
}

const EVIDENCE_OPTIONS: Array<{
  value: DistributionEvidence;
  label: string;
  hint: string;
}> = [
  {
    value: "explicit_email",
    label: "They explicitly said yes — in writing",
    hint: "Email reply or written confirmation",
  },
  {
    value: "explicit_verbal",
    label: "They explicitly said yes — verbally",
    hint: "Call, voicemail, meeting",
  },
  {
    value: "observed_external",
    label: "I observed them sharing externally",
    hint: "IG story, listserv thread, dept newsletter",
  },
  {
    value: "self_reported",
    label: "They told me they shared it",
    hint: "After-the-fact confirmation",
  },
];

interface Props {
  evidence: DistributionEvidence;
  notes: string;
  onEvidenceChange: (next: DistributionEvidence) => void;
  onNotesChange: (next: string) => void;
  /** Optional heading shown above the radios. The standalone
   *  MarkPartnerModal sets this; inline embeds skip it. */
  heading?: string;
}

export function PartnerEvidencePanel({
  evidence,
  notes,
  onEvidenceChange,
  onNotesChange,
  heading,
}: Props) {
  return (
    <div className="space-y-2 rounded-md border border-primary-200 bg-primary-50/40 p-3">
      <p className="text-xs font-medium text-primary-900">
        {heading ?? "How do you know they're distributing?"}
      </p>
      <div className="space-y-1.5">
        {EVIDENCE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 ${
              evidence === opt.value
                ? "border-primary-600 bg-white"
                : "border-gray-200 bg-white hover:bg-primary-50/30"
            }`}
          >
            <input
              type="radio"
              name="partner-evidence"
              className="mt-0.5"
              checked={evidence === opt.value}
              onChange={() => onEvidenceChange(opt.value)}
            />
            <span className="flex-1">
              <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
              <span className="block text-xs text-gray-500">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <Input
        as="textarea"
        label="Evidence notes (optional)"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={2}
        placeholder='e.g. "Saw on @berkeleypremed IG story 5/4"'
        size="sm"
      />
    </div>
  );
}

export const DEFAULT_PARTNER_EVIDENCE: DistributionEvidence = "explicit_verbal";
