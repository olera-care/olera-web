"use client";

import { useEffect, useState } from "react";
import type { ApprovalType } from "@/lib/student-outreach/types";
import Select from "@/components/ui/Select";

interface Props {
  onCancel: () => void;
  onSubmit: (payload: {
    approval_type: ApprovalType;
    approval_for: string;
    approval_from?: string;
    notes?: string;
  }) => void | Promise<void>;
}

const TYPES: Array<{ value: ApprovalType; label: string; hint: string }> = [
  { value: "department", label: "Department", hint: "e.g. permission to contact CS faculty directly" },
  { value: "marketing", label: "University marketing", hint: "e.g. green-light to use university branding" },
  { value: "listserv", label: "Listserv access", hint: "e.g. send through dept listserv" },
  { value: "job_board", label: "Job board posting", hint: "e.g. post on student job portal" },
  { value: "other", label: "Other", hint: "Describe in notes" },
];

export function RequestApprovalModal({ onCancel, onSubmit }: Props) {
  const [approvalType, setApprovalType] = useState<ApprovalType>("department");
  const [approvalFor, setApprovalFor] = useState("");
  const [approvalFrom, setApprovalFrom] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = async () => {
    if (!approvalFor.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        approval_type: approvalType,
        approval_for: approvalFor.trim(),
        approval_from: approvalFrom.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Request approval</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              We'll auto-queue a 5-day follow-up reminder.
            </p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="px-6 py-4 space-y-3">
          <div>
            <Select
              label="Approval type"
              value={approvalType}
              onChange={(val) => setApprovalType(val as ApprovalType)}
              size="sm"
              options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            <p className="mt-1 text-[11px] text-gray-500">
              {TYPES.find((t) => t.value === approvalType)?.hint}
            </p>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">What approval is for *</span>
            <input
              value={approvalFor}
              onChange={(e) => setApprovalFor(e.target.value)}
              placeholder='e.g. "Contact CS faculty directly via public emails"'
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Approval from (who)</span>
            <input
              value={approvalFrom}
              onChange={(e) => setApprovalFrom(e.target.value)}
              placeholder='e.g. "Dr. Garcia, CS Dept Chair"'
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !approvalFor.trim()}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Requesting…" : "Request"}
          </button>
        </footer>
      </div>
    </div>
  );
}
