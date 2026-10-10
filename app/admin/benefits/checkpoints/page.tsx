"use client";

/**
 * /admin/benefits/checkpoints: the caseworker's measure (founding doc, 9 Oct 2026).
 *
 * Five checkpoints read in order: interview begun, interview completed,
 * application started, application submitted, program acceptance. Counted per
 * family (browser) in lib/benefits/checkpoints.ts. "Submitted" is the number
 * read now; dollars secured joins once families report acceptances.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

type Checkpoint = "begun" | "completed" | "started" | "submitted" | "accepted";
type Arm = "form" | "conversation" | "study" | "other";
type Counts = Record<Checkpoint, number>;
type Data = {
  from: string;
  truncated: boolean;
  weeks: Array<{ week: string; all: Counts; byArm: Record<Arm, Counts> }>;
  total: { all: Counts; byArm: Record<Arm, Counts> };
  byState: Array<{ state: string; counts: Counts }>;
};

const STEPS: Array<{ id: Checkpoint; label: string; detail: string }> = [
  { id: "begun", label: "Interview begun", detail: "Answered the first question" },
  { id: "completed", label: "Interview completed", detail: "Reached a plan" },
  { id: "started", label: "Application started", detail: "Opened an apply-along" },
  { id: "submitted", label: "Application submitted", detail: "Told us it went in" },
  { id: "accepted", label: "Program acceptance", detail: "Told us they were approved" },
];

const SHORT: Record<Checkpoint, string> = { begun: "Begun", completed: "Plan", started: "Started", submitted: "Submitted", accepted: "Accepted" };

const VIEWS: Array<{ id: "all" | Arm; label: string }> = [
  { id: "all", label: "Everyone" },
  { id: "conversation", label: "Conversation" },
  { id: "form", label: "Form" },
  { id: "study", label: "Study" },
  { id: "other", label: "Not randomized" },
];

function day(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function rate(part: number, whole: number) {
  return whole ? `${Math.round((100 * part) / whole)}%` : "–";
}

export default function CheckpointsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"all" | Arm>("all");

  useEffect(() => {
    fetch("/api/admin/benefits/checkpoints", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) setError(body?.error || `Couldn't load (${r.status}). Try refreshing.`);
        else setData(body);
      })
      .catch(() => setError("Network error. Try refreshing."));
  }, []);

  const pick = (c: { all: Counts; byArm: Record<Arm, Counts> }) => (view === "all" ? c.all : c.byArm[view]);
  const total = data ? pick(data.total) : null;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/benefits" className="text-xs text-gray-400 hover:text-gray-700">← Benefits</Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">Caseworker checkpoints</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          How far each family gets, in five steps. Applications submitted is the number to watch now; acceptances take weeks to arrive.
          A family is one browser.
        </p>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}
      {!error && !data && <p className="text-sm text-gray-400">Loading…</p>}

      {data && total && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  view === v.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Since {day(data.from.slice(0, 10))}</h2>
            <ol className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {STEPS.map((s, i) => (
                <li key={s.id} className={`rounded-lg border p-3 ${s.id === "submitted" ? "border-primary-300 bg-primary-50" : "border-gray-200"}`}>
                  <p className="text-xs text-gray-500">{i + 1} · {s.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 tabular-nums mt-1">{total[s.id]}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {i === 0 ? s.detail : `${rate(total[s.id], total[STEPS[i - 1].id])} of step ${i}`}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-1">By week</h2>
            <p className="text-sm text-gray-500 mb-3">Families reaching each step that week (weeks start Monday). A family can begin one week and apply the next.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-400">
                    <th className="font-normal pb-2 pr-3">Week of</th>
                    {STEPS.map((s) => <th key={s.id} className="font-normal pb-2 px-2 text-right whitespace-nowrap">{SHORT[s.id]}</th>)}
                  </tr>
                </thead>
                <tbody className="tabular-nums divide-y divide-gray-100 border-y border-gray-100">
                  {data.weeks.map((w) => {
                    const c = pick(w);
                    return (
                      <tr key={w.week}>
                        <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{day(w.week)}</td>
                        {STEPS.map((s) => <td key={s.id} className={`py-2 px-2 text-right ${s.id === "submitted" ? "font-semibold text-gray-900" : "text-gray-700"}`}>{c[s.id]}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {view === "all" && (
            <section className="mb-10">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Conversation against form</h2>
              <p className="text-sm text-gray-500 mb-3">Randomized families only, since the split began on 7 Oct.</p>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-400">
                    <th className="font-normal pb-2" />
                    <th className="font-normal pb-2 text-right">Begun</th>
                    <th className="font-normal pb-2 text-right">Reached a plan</th>
                    <th className="font-normal pb-2 text-right">Started an application</th>
                    <th className="font-normal pb-2 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums divide-y divide-gray-100 border-y border-gray-100">
                  {(["conversation", "form"] as const).map((arm) => {
                    const c = data.total.byArm[arm];
                    return (
                      <tr key={arm}>
                        <td className="py-2 text-gray-900 capitalize">{arm}</td>
                        <td className="py-2 text-right">{c.begun}</td>
                        <td className="py-2 text-right">{c.completed} <span className="text-gray-400">({rate(c.completed, c.begun)})</span></td>
                        <td className="py-2 text-right">{c.started} <span className="text-gray-400">({rate(c.started, c.begun)})</span></td>
                        <td className="py-2 text-right">{c.submitted} <span className="text-gray-400">({rate(c.submitted, c.begun)})</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-1">By state</h2>
            <p className="text-sm text-gray-500 mb-3">Everyone since {day(data.from.slice(0, 10))}, most families first.</p>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400">
                  <th className="font-normal pb-2">State</th>
                  {STEPS.map((s) => <th key={s.id} className="font-normal pb-2 text-right">{SHORT[s.id]}</th>)}
                </tr>
              </thead>
              <tbody className="tabular-nums divide-y divide-gray-100 border-y border-gray-100">
                {data.byState.slice(0, 15).map((r) => (
                  <tr key={r.state}>
                    <td className="py-1.5 text-gray-900">{r.state}</td>
                    {STEPS.map((s) => <td key={s.id} className="py-1.5 text-right text-gray-700">{r.counts[s.id]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="text-xs text-gray-400 space-y-1 max-w-2xl">
            <p>Steps 1 to 3 come from the finder, the conversation and the Medicare Savings apply-along. Submitted comes from the apply-along and from family records; acceptance only from records (a text reply or a tap on the plan page).</p>
            <p>Not randomized: families before the split, study links, and direct links. Preview and staging traffic is left out from 10 Oct; before that, apply-along opens before it went live (7 Oct, 13:30 UTC) and three known screenshot runs are left out.</p>
            <p>Not yet here: family type (who the care is for is not recorded on events) and the CARE-NAV satisfaction survey.</p>
            {data.truncated && <p className="text-rose-700">Too many events to read in full; numbers are a floor.</p>}
          </section>
        </>
      )}
    </div>
  );
}
