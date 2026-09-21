"use client";

import { useEffect } from "react";
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
/**
 * Sections where a record can be typed in, and what one is called.
 *
 * Only providers, deliberately. Everything else on the board either arrives
 * from a system — students from applications, the job board from the channel
 * — or is found by a rung whose whole job is finding them, and a hand-typed
 * row would sit outside the count those rungs are measured on.
 */
const ADD_BY_HAND = new Map<SectionKey, string>([["providers", "provider"]]);

export default function SummaryView({
  university,
  open,
  onToggle,
  cameFrom,
  onStart,
  onOpenRecord,
  onAddRecord,
}: {
  university: BoardUniversity;
  /**
   * Which sections are expanded. Held above this component because it
   * unmounts every time a record is opened, and coming back to a collapsed
   * list after every single record is the difference between screening a
   * campus and fighting the screen.
   */
  open: Partial<Record<SectionKey, boolean>>;
  onToggle: (section: SectionKey) => void;
  /** The record last looked at, scrolled back into view on the way in. */
  cameFrom: string | null;
  onStart: () => void;
  onOpenRecord: (record: BoardRecord) => void;
  /** Start a record nobody has in the directory. Providers only, for now. */
  onAddRecord: (section: SectionKey) => void;
}) {
  // Put the record you were just looking at back under your eyes. Centred
  // rather than at the top, because the rows either side are the context.
  useEffect(() => {
    if (!cameFrom) return;
    document
      .getElementById(`board-record-${cameFrom}`)
      ?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [cameFrom]);

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
          // A singleton section IS its record — the job board. Expanding it
          // to reveal the only thing in it is a click that buys nothing, so
          // the row opens the record and loses its triangle.
          const only = ladder.singleton && records.length === 1 ? records[0] : null;
          const expanded = Boolean(open[key]);
          return (
            <div key={key} className="rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => (only ? onOpenRecord(only) : onToggle(key))}
                className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left hover:bg-gray-50"
              >
                <span className="w-2.5 shrink-0 text-[10px] text-gray-400">
                  {only ? "" : expanded ? "▾" : "▸"}
                </span>
                <span className="flex-1 text-[13.5px] font-medium text-gray-900">{ladder.label}</span>
                {waiting > 0 ? (
                  <span className="text-[12.5px] font-semibold tabular-nums text-warning-700">
                    {waiting}
                  </span>
                ) : only ? (
                  // "1" is not news about a thing there is exactly one of.
                  // Whether it is live is.
                  only.state && <span className="text-[12px] text-success-700">{only.state}</span>
                ) : records.length ? (
                  <span className="text-[12px] text-gray-400">{records.length}</span>
                ) : null}
              </button>

              {expanded && !only && (
                <div className="border-t border-gray-100 px-3.5 pb-2">
                  {records.length === 0 ? (
                    <p className="py-3 text-center text-[12.5px] text-gray-400">
                      {ladder.emptyNote ?? "Nothing here yet."}
                    </p>
                  ) : null}
                  {records.length > 0 && (
                    records.map((r) => {
                      const n = recordReady(r);
                      const soon = r.tasks
                        .filter((t) => !t.done && !isReady(t))
                        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
                      const dead = r.state && /^(archived|stopped|declined)/.test(r.state);
                      return (
                        <button
                          key={r.id}
                          id={`board-record-${r.id}`}
                          type="button"
                          onClick={() => onOpenRecord(r)}
                          className={`flex w-full items-center gap-2 border-b border-gray-100 py-2 text-left last:border-b-0 hover:bg-gray-50 ${
                            r.id === cameFrom ? "bg-primary-25" : ""
                          }`}
                        >
                          {/* Visible from the list, which is the point of it. */}
                          {r.flaggedOn && (
                            <span
                              title="Flagged for manager review"
                              aria-label="Flagged for manager review"
                              className="shrink-0 text-warning-600"
                            >
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path
                                  d="M3.5 14.5V2M3.5 2.5h7.2l-1.3 2.6 1.3 2.6H3.5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )}
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
                  {/*
                    The catchment finds a provider only if the directory has
                    one. An agency somebody knows about but the directory has
                    never heard of would otherwise have nowhere to go, so the
                    list ends with a way to start one by hand. Last, and grey:
                    typing a record is the exception, not the work.
                  */}
                  {ADD_BY_HAND.has(key) && (
                    <button
                      type="button"
                      onClick={() => onAddRecord(key)}
                      className="mt-1 flex w-full items-center gap-1.5 border-t border-dashed border-gray-200 py-2.5 text-left text-[12.5px] font-medium text-gray-500 hover:text-primary-700"
                    >
                      <span className="text-[13px] leading-none">+</span>
                      Add a {ADD_BY_HAND.get(key)}
                    </button>
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
