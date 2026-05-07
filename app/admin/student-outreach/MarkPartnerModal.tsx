"use client";

/**
 * v9.0 Phase 7 Commit G: Mark-as-Partner standalone modal.
 *
 * One of four entry points to the partner-conversion flow. The other
 * three (LogCall / ReplyClassifier / LogMeeting) embed
 * PartnerEvidencePanel inline below their primary picker so the
 * partner branch lives in the same modal as the operational log.
 *
 * This modal is the standalone path — opened by the "Make Partner ★"
 * overflow item when admin wants to convert a stakeholder without
 * an accompanying call/reply/meeting log. Same panel, same submit
 * verb ("Mark as Partner"), no chained second modal.
 */

import { useEffect, useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import {
  PartnerEvidencePanel,
  DEFAULT_PARTNER_EVIDENCE,
  type PartnerEvidence,
} from "@/components/admin/medjobs/PartnerEvidencePanel";
import type { DistributionEvidence } from "@/lib/student-outreach/types";

interface Props {
  organizationName: string;
  onCancel: () => void;
  onConfirm: (payload: PartnerEvidence) => void | Promise<void>;
}

export function MarkPartnerModal({ organizationName, onCancel, onConfirm }: Props) {
  const [evidence, setEvidence] = useState<DistributionEvidence>(DEFAULT_PARTNER_EVIDENCE);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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
      <PartnerEvidencePanel
        evidence={evidence}
        notes={notes}
        onEvidenceChange={setEvidence}
        onNotesChange={setNotes}
      />
    </LogModalShell>
  );
}
