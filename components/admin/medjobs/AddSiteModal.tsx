"use client";

/**
 * v9.0 Phase 7: Add Site modal. Triggered from the Sites page header
 * action. Lets admin activate a university territory by picking from
 * the PARTNER_UNIVERSITIES preset list.
 *
 * The DB table is still `student_outreach_campuses`; only the UI says
 * "site". Endpoint stays /api/admin/student-outreach/campuses.
 *
 * Single-pick by design — bulk multi-select landed briefly in Commit
 * H but pulled the operational language toward batch when daily flow
 * is one-territory-at-a-time. Restoring the simpler dropdown keeps
 * the modal calm and unambiguous.
 */

import { useState } from "react";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import { refreshMedJobs } from "@/hooks/useMedJobsRefresh";

interface Props {
  /** Slugs of universities already activated. Used to grey out rows
   *  in the picker so admin doesn't try to re-add them. */
  existingSlugs?: ReadonlySet<string>;
  onClose: () => void;
  onCreated: (slug: string, name: string) => void;
}

export function AddSiteModal({ existingSlugs, onClose, onCreated }: Props) {
  const existing = existingSlugs ?? new Set<string>();
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === selectedSlug);
    if (!uni) {
      setError("Pick a university first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add site");
      // Adding a Site queues a research card in Prospects → Partner
      // Prospects and exposes the site's catchment as provider
      // prospects. Both signals flow into sidebar fractions and the
      // In Basket counts — broadcast the refresh so every mounted
      // MedJobs surface picks them up immediately rather than waiting
      // for the next manual navigation.
      refreshMedJobs();
      onCreated(uni.slug, uni.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add Site</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Activate a university territory. Provider prospects in the catchment
            will surface in In Basket as virtual rows; once a provider converts,
            student-stakeholder research unlocks.
          </p>
        </header>

        <div className="space-y-3 px-6 py-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              University
            </span>
            <select
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setError(null);
              }}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            >
              <option value="">Pick a university…</option>
              {PARTNER_UNIVERSITIES.map((u) => (
                <option key={u.slug} value={u.slug} disabled={existing.has(u.slug)}>
                  {u.name} ({u.city}, {u.state})
                  {existing.has(u.slug) ? " — added" : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-gray-500">
              Limited to {PARTNER_UNIVERSITIES.length} universities with mapped
              catchment cities. New regions can be added to{" "}
              <code>lib/staffing-outreach/partner-universities.ts</code>.
            </span>
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !selectedSlug}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add Site"}
          </button>
        </footer>
      </div>
    </div>
  );
}
