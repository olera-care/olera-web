"use client";

/**
 * ProfileCard — the Providers and Students cards at the top of a university
 * drawer, above the five channels.
 *
 * Providers and students are profiles, not tasks: they exist whether or not
 * there is anything to do about them today. The card is the roster; the Tasks
 * tab is today's queue. Both reach the same detail panel.
 *
 * Counts read "N clients · M in catchment" and "N applicants · M qualified".
 * Clients-confirmed and students-qualified are not instrumented yet, so those
 * halves render a dash rather than a zero that looks like a measurement.
 */

import { useState } from "react";

export interface ProfileRow {
  id: string;
  name: string;
  /** Right-hand status: "Round 3 of 7", "client", "archived", … */
  state: string;
  /** Second line — phone, or whatever identifies the row at a glance. */
  detail?: string | null;
  /** Red dot: something is due on this row today. */
  due?: boolean;
}

export default function ProfileCard({
  title,
  primaryCount,
  primaryLabel,
  secondaryCount,
  secondaryLabel,
  rows,
  emptyText,
  addLabel,
  onAdd,
  onOpenRow,
}: {
  title: string;
  /** Null renders a dash — the metric exists but is not instrumented. */
  primaryCount: number | null;
  primaryLabel: string;
  secondaryCount: number | null;
  secondaryLabel: string;
  rows: ProfileRow[];
  emptyText: string;
  addLabel?: string;
  onAdd?: () => void;
  onOpenRow?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const n = (v: number | null) => (v == null ? "—" : String(v));

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-900">
          {title}
        </span>
        <span className="shrink-0 text-[12px] text-gray-500">
          {n(primaryCount)} {primaryLabel} · {n(secondaryCount)} {secondaryLabel}
        </span>
        <span className="shrink-0 text-gray-400" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-3 py-2">
          {rows.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-gray-400">{emptyText}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onOpenRow?.(r.id)}
                    className="flex w-full items-center gap-2 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="w-2 shrink-0">
                      {r.due ? (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-error-500" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-gray-900">{r.name}</span>
                      {r.detail ? (
                        <span className="block truncate text-[11px] text-gray-500">{r.detail}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-500">{r.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {addLabel && onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1 w-full rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
            >
              {addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
