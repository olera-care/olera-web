"use client";

import { useState } from "react";
import { LADDERS, SECTION_ORDER, type SectionKey } from "@/lib/medjobs/ladders";
import {
  dueLabel,
  isReady,
  recordReady,
  sectionReady,
  type BoardRecord,
  type BoardUniversity,
} from "@/lib/medjobs/task-board";

/**
 * What a university looks like when you open it: the seven sections, how
 * much each is waiting on, and one button that starts working through it.
 *
 * This is the place you come back to. Running tasks in a row is the fast
 * path, not the only one — an operator who wants to see the shape of a
 * campus before diving in should not have to close and reopen it.
 */
export default function SummaryView({
  university,
  onStart,
  onOpenRecord,
}: {
  university: BoardUniversity;
  onStart: () => void;
  onOpenRecord: (record: BoardRecord) => void;
}) {
  const [open, setOpen] = useState<Partial<Record<SectionKey, boolean>>>({});

  return (
    <div className="px-5 py-4">
      {SECTION_ORDER.some((s) => sectionReady(university, s) > 0) && (
        <button
          type="button"
          onClick={onStart}
          className="mb-3 w-full rounded-lg border border-primary-600 bg-primary-600 px-4 py-2.5 text-left text-[13.5px] font-semibold text-white hover:bg-primary-700"
        >
          Start the next task
        </button>
      )}

      <div className="space-y-2">
        {SECTION_ORDER.map((key) => {
          const ladder = LADDERS[key];
          const records = university.records[key] ?? [];
          const waiting = sectionReady(university, key);
          const expanded = Boolean(open[key]);
          return (
            <div key={key} className="rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left hover:bg-gray-50"
              >
                <span className="w-2.5 shrink-0 text-[10px] text-gray-400">
                  {expanded ? "▾" : "▸"}
                </span>
                <span className="flex-1 text-[13.5px] font-medium text-gray-900">{ladder.label}</span>
                {waiting > 0 ? (
                  <span className="text-[12.5px] font-semibold tabular-nums text-warning-700">
                    {waiting}
                  </span>
                ) : records.length ? (
                  <span className="text-[12px] text-gray-400">{records.length}</span>
                ) : null}
              </button>

              {expanded && (
                <div className="border-t border-gray-100 px-3.5 pb-2">
                  {records.length === 0 ? (
                    <p className="py-3 text-center text-[12.5px] text-gray-400">
                      {ladder.emptyNote ?? "Nothing here yet."}
                    </p>
                  ) : (
                    records.map((r) => {
                      const n = recordReady(r);
                      const soon = r.tasks
                        .filter((t) => !t.done && !isReady(t))
                        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
                      const dead = r.state && /^(archived|stopped|declined)/.test(r.state);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onOpenRecord(r)}
                          className="flex w-full items-center gap-2 border-b border-gray-100 py-2 text-left last:border-b-0 hover:bg-gray-50"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] text-gray-900">
                            {r.name}
                          </span>
                          <span
                            className={`shrink-0 text-[11.5px] ${
                              n
                                ? "font-semibold tabular-nums text-warning-700"
                                : dead
                                  ? "text-gray-400"
                                  : r.state
                                    ? "text-success-700"
                                    : "text-gray-500"
                            }`}
                          >
                            {n ? n : r.state ? r.state : soon ? dueLabel(soon.dueAt) : ""}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
