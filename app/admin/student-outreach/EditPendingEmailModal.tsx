"use client";

/**
 * Compact modal for editing a single upcoming email's subject + body.
 * Disabled within 15 min of due_at server-side; UI does its own check.
 */

import { useEffect, useState } from "react";
import type { Task } from "@/lib/student-outreach/types";

interface Props {
  task: Task;
  onCancel: () => void;
  onSubmit: (payload: { subject: string; body: string }) => Promise<void>;
}

export function EditPendingEmailModal({ task, onCancel, onSubmit }: Props) {
  const payload = task.payload as Record<string, unknown>;
  const [subject, setSubject] = useState(String(payload.subject ?? ""));
  const [body, setBody] = useState(String(payload.body ?? ""));
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = async () => {
    setErr(null);
    if (!subject.trim() || !body.trim()) return setErr("Subject and body required");
    setSubmitting(true);
    try {
      await onSubmit({ subject: subject.trim(), body: body.trim() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Edit upcoming email</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Day {String(payload.day ?? "?")} · scheduled {new Date(task.due_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Body</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-400 focus:outline-none"
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
            disabled={submitting}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
