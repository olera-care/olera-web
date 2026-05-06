"use client";

/**
 * AddCustomTaskModal — adds a one-off task to a stakeholder's queue.
 *
 * Stored as a `manual_followup` task with payload.reason = "custom" and
 * payload.description = the admin's text. The task surfaces in Queued
 * with the description as its title, and opens the row's drawer.
 */

import { useEffect, useMemo, useState } from "react";
import {
  STAKEHOLDER_TYPE_LABELS,
  type Campus,
  type StakeholderType,
} from "@/lib/student-outreach/types";

interface StakeholderOption {
  id: string;
  organization_name: string;
  stakeholder_type: StakeholderType;
  campus_slug: string;
  campus_name: string;
}

interface Props {
  campuses: Campus[];
  /** Pre-fetched list of stakeholders the admin can add tasks to. */
  stakeholders: StakeholderOption[];
  /** Optional preselected stakeholder (when opened from a drawer). */
  defaultOutreachId?: string;
  onCancel: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export function AddCustomTaskModal({
  stakeholders,
  defaultOutreachId,
  onCancel,
  onCreated,
  onError,
}: Props) {
  const [outreachId, setOutreachId] = useState<string>(defaultOutreachId ?? "");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState<string>(() => {
    // Default: tomorrow 9am local
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toLocalInput(d);
  });
  const [filter, setFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const filteredStakeholders = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return stakeholders;
    return stakeholders.filter(
      (s) =>
        s.organization_name.toLowerCase().includes(q) ||
        s.campus_name.toLowerCase().includes(q),
    );
  }, [stakeholders, filter]);

  const submit = async () => {
    if (!outreachId) return onError("Pick a stakeholder");
    if (!description.trim()) return onError("Add a description");
    if (!dueAt) return onError("Set a due date");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/student-outreach/${outreachId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "queue_manual_task",
          task_type: "manual_followup",
          due_at: new Date(dueAt).toISOString(),
          notes: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      onCreated();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Add a task</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              For one-off work the system can't predict. Shows up in Queued at the due date.
            </p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Stakeholder</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search stakeholders…"
              className="mb-1 w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
            <select
              value={outreachId}
              onChange={(e) => setOutreachId(e.target.value)}
              size={6}
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
            >
              {filteredStakeholders.length === 0 && <option value="">No matches</option>}
              {filteredStakeholders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.organization_name} · {s.campus_name} · {STAKEHOLDER_TYPE_LABELS[s.stakeholder_type]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">What needs to be done?</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Follow up on the listserv access she mentioned"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">When is it due?</span>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
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
            disabled={submitting || !outreachId || !description.trim() || !dueAt}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add task"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function toLocalInput(d: Date): string {
  // datetime-local expects YYYY-MM-DDTHH:mm in local time.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
