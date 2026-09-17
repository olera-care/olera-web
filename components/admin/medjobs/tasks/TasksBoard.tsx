"use client";

import { useCallback, useEffect, useState } from "react";
import StatusDot, { DueDot, statusLabel } from "@/components/admin/medjobs/activation/StatusDot";
import { LADDERS, SECTION_ORDER, type SectionKey } from "@/lib/medjobs/ladders";
import { readyCount, sectionReady, type BoardUniversity } from "@/lib/medjobs/task-board";
import UniversityFlow from "./UniversityFlow";

/**
 * The Tasks tab: every university, how much is waiting, and the state of
 * the five channels you reach it through.
 *
 * The table is the roster and has to survive being read at a glance across
 * dozens of rows, so it stayed as it was — one column added for the count.
 * Clicking a row opens the university on its summary, from which one button
 * starts working through the tasks in a row.
 */

const CHANNEL_OF: Partial<Record<SectionKey, "st3" | "st4" | "st5" | "st6" | "st7">> = {
  jobboard: "st3",
  advisors: "st4",
  orgs: "st5",
  events: "st6",
  professors: "st7",
};

export default function TasksBoard({ seed }: { seed?: BoardUniversity[] }) {
  const [board, setBoard] = useState<BoardUniversity[] | null>(seed ?? null);
  const [failed, setFailed] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [, force] = useState(0);

  const load = useCallback(async () => {
    if (seed) return;
    try {
      const res = await fetch("/api/admin/medjobs/tasks-board");
      const d = (await res.json()) as { universities: BoardUniversity[]; error?: string };
      if (!res.ok) throw new Error(d.error ?? `Request failed (${res.status}).`);
      setBoard(d.universities);
      setFailed(null);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "The board could not be loaded.");
    }
  }, [seed]);

  useEffect(() => {
    void load();
  }, [load]);

  if (failed) {
    return <p className="rounded-md bg-error-50 px-3 py-2.5 text-sm text-error-700">{failed}</p>;
  }
  if (!board) {
    return <p className="px-1 py-8 text-sm text-gray-500">Loading universities…</p>;
  }
  if (board.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center">
        <p className="text-sm font-medium text-gray-900">No universities yet</p>
        <p className="mt-1 text-xs text-gray-500">Add one and its first tasks appear here.</p>
      </div>
    );
  }

  // Most waiting first, then alphabetical. Work top down and stop when the
  // counts run out.
  const rows = [...board].sort((a, b) => readyCount(b) - readyCount(a) || a.name.localeCompare(b.name));
  const open = board.find((u) => u.slug === openSlug) ?? null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[54rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className={TH}>University</th>
              <th className={`${TH} text-center`}>Tasks</th>
              {SECTION_ORDER.map((s) => (
                <th key={s} className={`${TH} text-center`}>
                  {LADDERS[s].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const n = readyCount(u);
              return (
                <tr
                  key={u.slug}
                  onClick={() => setOpenSlug(u.slug)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 shrink-0">{n ? <DueDot /> : null}</span>
                      <span className="text-[13px] font-medium text-gray-900">{u.name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-center text-[13px] font-semibold tabular-nums text-warning-700">
                    {n || <span className="text-gray-300">·</span>}
                  </td>
                  {SECTION_ORDER.map((s) => {
                    const channel = CHANNEL_OF[s];
                    // Providers and Students have no channel dot — their
                    // counts are not instrumented, so they stay a dash
                    // rather than a plausible-looking zero.
                    if (!channel) {
                      const waiting = sectionReady(u, s);
                      return (
                        <td key={s} className="py-2.5 pr-3 text-center text-[12px] tabular-nums text-gray-400">
                          {waiting || "—"}
                        </td>
                      );
                    }
                    const status = u.channels[channel] ?? "not_yet";
                    return (
                      <td key={s} className="py-2.5 pr-3">
                        <span className="flex items-center justify-center" title={statusLabel(status)}>
                          <StatusDot status={status} />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-gray-500">
        A red dot means something is waiting. Open a university to see its sections, then start
        working through them one task at a time.
      </p>

      {open && (
        <UniversityFlow
          university={open}
          onClose={() => setOpenSlug(null)}
          onChanged={() => force((x) => x + 1)}
          onReload={load}
        />
      )}
    </>
  );
}

const TH = "py-2 pr-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500";
