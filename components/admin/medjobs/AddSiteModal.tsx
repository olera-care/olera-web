"use client";

/**
 * v9.0 Phase 7 Commit H: Add Site modal — multi-select.
 *
 * Activate one or more university territories at once. Replaces the
 * single-pick dropdown with a scrollable checkbox list; already-added
 * universities are disabled with an "added" tag so admin sees the
 * full inventory at a glance.
 *
 * The DB table is still `student_outreach_campuses`; only the UI says
 * "site". Endpoint stays /api/admin/student-outreach/campuses and is
 * idempotent (a re-POST of an existing slug surfaces an inline error
 * but doesn't damage state). The bulk path loops POSTs sequentially —
 * N round trips, but typical batches are 1-10 universities, so
 * latency is fine and we avoid a separate batch endpoint.
 */

import { useState } from "react";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";

interface Props {
  /** Slugs of universities already activated. Used to disable rows
   *  in the picker so admin doesn't try to re-add them. */
  existingSlugs?: ReadonlySet<string>;
  onClose: () => void;
  /** Called once after the bulk run finishes (with successCount). */
  onCreated: (successCount: number) => void;
}

export function AddSiteModal({ existingSlugs, onClose, onCreated }: Props) {
  const existing = existingSlugs ?? new Set<string>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setError(null);
  };

  const submit = async () => {
    if (selected.size === 0) {
      setError("Pick at least one university.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setProgress({ done: 0, total: selected.size });
    let successCount = 0;
    try {
      for (const slug of selected) {
        const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === slug);
        if (!uni) continue;
        const res = await fetch("/api/admin/student-outreach/campuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: uni.slug,
            name: uni.name,
            state: uni.state,
            city: uni.city,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(`${uni.name}: ${body.error || "Failed to add"}`);
        }
        successCount += 1;
        setProgress({ done: successCount, total: selected.size });
      }
      onCreated(successCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = (() => {
    if (submitting && progress) return `Adding ${progress.done}/${progress.total}…`;
    if (selected.size === 0) return "Add Site";
    if (selected.size === 1) return "Add 1 site";
    return `Add ${selected.size} sites`;
  })();

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add Sites</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Activate one or more university territories. Provider prospects in
            each catchment surface in In Basket as virtual rows; once a provider
            converts, student-stakeholder research unlocks.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <ul className="space-y-1">
            {PARTNER_UNIVERSITIES.map((u) => {
              const isExisting = existing.has(u.slug);
              const isChecked = selected.has(u.slug);
              return (
                <li key={u.slug}>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 ${
                      isExisting
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                        : isChecked
                          ? "border-emerald-500 bg-emerald-50/40"
                          : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isExisting || submitting}
                      onChange={() => toggle(u.slug)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    <span className="flex-1 text-sm">
                      <span className="font-medium">{u.name}</span>
                      <span className="ml-1.5 text-xs text-gray-500">
                        {u.city}, {u.state}
                      </span>
                    </span>
                    {isExisting && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Added
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] text-gray-500">
            Limited to {PARTNER_UNIVERSITIES.length} universities with mapped
            catchment cities. New regions can be added to{" "}
            <code>lib/staffing-outreach/partner-universities.ts</code>.
          </p>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <span className="text-xs text-gray-500">
            {selected.size > 0 && !submitting && `${selected.size} selected`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || selected.size === 0}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
