"use client";

/**
 * AddStakeholderTaskModal — v8.10.26.
 *
 * Lightweight per-stakeholder task entry. Opens from inside the
 * drawer's Tasks section; the stakeholder is already in context, so
 * the modal is just a textarea + Save. No stakeholder picker, no
 * due-date picker, no priority — by design.
 *
 * Posts a `queue_manual_task` action with task_type=manual_followup
 * and a due_at of "now" so the task surfaces immediately in the
 * drawer's Tasks list and the row's customTaskByOutreach pickup on
 * the next queue refresh. The server tags the task with
 * payload.reason="custom" so it's distinguishable from auto-queued
 * manual_followup tasks (e.g. cron-side missed-recipient followups).
 */

import { useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";

interface Props {
  organizationName: string;
  contactName: string | null;
  /** When set, the modal opens in edit mode pre-populated with this
   *  text. The header title flips from "Add task" to "Edit task" and
   *  the submit button reads "Save" instead of "Add task". */
  initialText?: string;
  onCancel: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export function AddStakeholderTaskModal({
  organizationName,
  contactName,
  initialText,
  onCancel,
  onSubmit,
}: Props) {
  const [text, setText] = useState(initialText ?? "");
  const isEditing = initialText != null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim()) {
      setError("Add a task description.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(text.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSubmitting(false);
    }
  };

  return (
    <LogModalShell
      title={isEditing ? "Edit step" : "Add step"}
      subtitle={contactName ? `${contactName} · ${organizationName}` : organizationName}
      error={error}
      size="md"
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
            disabled={submitting || !text.trim()}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEditing ? "Save" : "Add step"}
          </button>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus
        placeholder="e.g. Follow up after department meeting; send updated flyer"
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
      />
    </LogModalShell>
  );
}
