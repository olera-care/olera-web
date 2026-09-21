"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SeekerRelationshipRow } from "@/lib/seeker-touches/types";
import { consentWarning, detailLine, nextLine, problemLine, stateOf, type Tone } from "@/lib/seeker-touches/present";

/**
 * Relationships — care seekers.
 *
 * NOT A TABLE. The first version was a four-column grid and every cell stacked
 * two or three lines of its own, so one family became a small page: eleven text
 * objects, four type sizes, three font families, nine forced wrap points. It
 * read as chaos however few chips were on it.
 *
 * So: one flex row per family. Name and one muted line on the left, where it
 * stands on the right. A row earns a third line only when something is actually
 * wrong, which means the loud rows are taller than the quiet ones and the shape
 * of the list is visible before a word of it is read. State is carried by a
 * coloured left rail — red act now, amber waiting on us, nothing otherwise —
 * rather than by five colours of chip.
 *
 * Nothing here is stored. Every value is derived at read time in
 * lib/seeker-touches/timeline.server.ts and put into words in ./present.
 */

/**
 * TABS ARE ACTIONS, NOT STATES.
 *
 * "Waiting on us" held 72 families across four unrelated jobs: answer a text,
 * make a promised call, write down an outcome somebody already gave us, and
 * fix a broken phone number. Working it meant re-deciding what KIND of task
 * each row was, one row at a time, seventy-two times. Splitting on the
 * physical action is what turns the list into a shift somebody can finish.
 *
 * "Providers have it" is deliberately NOT here. It was 295 rows, four times
 * the size of every real queue combined, and there is no action attached to
 * any of them: it means "we handed this over and have never seen what
 * happened", which is a measurement, not a job. Presenting it as a tab beside
 * genuine work implied the two were the same kind of thing and made the board
 * open feeling hopeless. It lives in the strip above as a number instead.
 *
 * "Chase a provider" was tried here and removed for the same reason, which is
 * worth recording because it looked like a real queue. provider_silent is 307
 * rows: past the cold threshold with nothing observable back. Putting a verb
 * on it does not make it workable, and nobody is chasing three hundred
 * agencies. The genuinely actionable version of that signal is a family who
 * told us the provider never got back to them, and those are already in
 * "Write down what they told us" with their answer attached.
 */
type Tab = "reply" | "call" | "record" | "reach" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "reply", label: "Reply to them" },
  { key: "call", label: "Call them" },
  { key: "record", label: "Write down what they told us" },
  { key: "reach", label: "Fix how we reach them" },
  { key: "all", label: "All" },
];

const TAB_BLURB: Record<Tab, string> = {
  reply: "They wrote to us and nobody has answered.",
  call: "We promised a call and have not reached them.",
  record: "They already told us how it went. The record still says pending.",
  reach: "No working phone or email, so nothing we send can land.",
  all: "Everyone with a live episode in the window.",
};

function matches(r: SeekerRelationshipRow, tab: Tab): boolean {
  // Opted out never appears in a work queue: there is no channel left to act
  // on, so it only pads the lists meant to be finished.
  if (tab !== "all" && r.flags.includes("opted_out")) return false;
  switch (tab) {
    case "reply":
      return r.flags.includes("awaiting_reply");
    case "call":
      return r.flags.includes("promise_owed");
    case "record":
      return r.flags.includes("outcome_reported");
    case "reach":
      return r.flags.includes("unreachable");
    default:
      return true;
  }
}

/** Everything with an action attached, for the "nothing is waiting" case. */
function openWorkCount(rows: SeekerRelationshipRow[]): number {
  return rows.filter((r) => TABS.some((t) => t.key !== "all" && matches(r, t.key))).length;
}

const RAIL: Record<Tone, string> = {
  act: "border-l-red-600 bg-red-50/30",
  warn: "border-l-amber-500 bg-amber-50/30",
  none: "border-l-transparent",
};

const STATE_TONE: Record<Tone, string> = {
  act: "text-red-700",
  warn: "text-amber-700",
  none: "text-gray-700",
};

const PROBLEM_TONE: Record<Tone, string> = {
  act: "text-red-700",
  warn: "text-amber-700",
  none: "text-gray-600",
};

export default function AdminSeekerRelationshipsPage() {
  const [rows, setRows] = useState<SeekerRelationshipRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("reply");
  const [days, setDays] = useState(45);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/seeker-touches?days=${days}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch {
      setError("Failed to load care seeker relationships. Reload to try again.");
      setRows([]);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { reply: 0, call: 0, record: 0, reach: 0, all: 0 };
    for (const r of rows ?? []) for (const t of TABS) if (matches(r, t.key)) c[t.key] += 1;
    return c;
  }, [rows]);

  // The facts true of most of the list live up here, so they never have to
  // appear on a row. This is what buys the rows their quiet.
  const stats = useMemo(() => {
    const all = rows ?? [];
    return {
      unanswered: all.filter((r) => r.flags.includes("awaiting_reply")).length,
      unreachable: all.filter((r) => r.flags.includes("unreachable")).length,
      withProvider: all.filter((r) => r.episode.state === "waiting").length,
      unnamed: all.filter((r) => r.label_is_fallback).length,
    };
  }, [rows]);

  const shown = (rows ?? []).filter((r) => matches(r, tab));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Care seekers</p>
          <h1 className="text-2xl font-semibold text-gray-950">Relationships</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Who is waiting on us, who we cannot reach, and who has gone quiet. Open a family for the whole story.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/relationships"
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Providers
          </Link>
          <a
            href={`/api/admin/seeker-touches?days=${days}&format=md`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Read as text
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Four numbers before the first row. */}
        <div className="grid grid-cols-2 gap-px bg-gray-200 sm:grid-cols-4">
          {[
            { n: stats.unanswered, k: "wrote to us, still unanswered", tone: "text-orange-800" },
            { n: stats.unreachable, k: "no working way to reach", tone: "text-red-700" },
            { n: stats.withProvider, k: "handed over, outcome unknown", tone: "text-gray-900" },
            { n: stats.unnamed, k: "we don't know their name", tone: "text-gray-900" },
          ].map((s) => (
            <div key={s.k} className="bg-white px-3.5 py-3">
              <div className={`text-[25px] font-semibold leading-none tracking-tight tabular-nums ${s.tone}`}>
                {rows === null ? "—" : s.n}
              </div>
              <div className="mt-1.5 text-[11.5px] leading-tight text-gray-500">{s.k}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 px-3.5 py-3 text-xs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-3 py-1 font-medium ${
                tab === t.key
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label} {rows ? `· ${counts[t.key]}` : ""}
            </button>
          ))}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="ml-auto rounded border border-gray-200 bg-white px-1.5 py-1 font-mono text-[11px] text-gray-600"
            aria-label="How far back to look"
          >
            <option value={14}>14 days</option>
            <option value={45}>45 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
        </div>

        {/* One line saying what this queue IS. The tab label is a verb; this is
            the rule behind it, so nobody has to infer why a row qualified. */}
        <p className="border-b border-gray-200 px-3.5 pb-3 text-[11.5px] leading-tight text-gray-500">{TAB_BLURB[tab]}</p>

        <div className="flex gap-4 border-b border-gray-200 py-2.5 pl-[19px] pr-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          <span className="flex-1">Family</span>
          <span className="w-[150px] shrink-0 text-right">Where it stands</span>
        </div>

        {error && <p className="px-4 py-6 text-sm text-red-600">{error}</p>}
        {rows === null && !error && <p className="px-4 py-10 text-center text-sm text-gray-400">Loading…</p>}
        {rows !== null && shown.length === 0 && (
          // An empty queue is the goal, not an error, and it should say where
          // the remaining work went rather than leaving a dead end.
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              {tab === "all" ? "Nobody has a live episode in this window." : "Nothing in this queue."}
            </p>
            {tab !== "all" && (
              <p className="mt-1 text-xs text-gray-500">
                {openWorkCount(rows) === 0
                  ? "No family is waiting on anything right now."
                  : `${openWorkCount(rows)} still need something in the other queues.`}
              </p>
            )}
          </div>
        )}

        {shown.map((r) => {
          const st = stateOf(r);
          const problem = problemLine(r);
          const consent = consentWarning(r);
          const next = nextLine(r);
          return (
            <Link
              key={r.seeker_id}
              href={`/admin/relationships/families/${r.seeker_id}`}
              className={`flex items-start gap-4 border-b border-l-[3px] border-b-gray-100 py-3.5 pl-4 pr-4 transition-colors last:border-b-0 hover:bg-gray-50 ${RAIL[st.tone]}`}
            >
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[15px] leading-snug tracking-[-0.01em] ${
                    r.label_is_fallback ? "font-normal text-gray-600" : "font-semibold text-gray-900"
                  }`}
                >
                  {r.label}
                </div>
                {detailLine(r) && (
                  <div className="mt-0.5 text-[12.5px] leading-normal text-gray-500">{detailLine(r)}</div>
                )}
                {problem && (
                  <div className={`mt-1.5 text-[13px] font-medium leading-snug ${PROBLEM_TONE[st.tone]}`}>{problem}</div>
                )}
                {next && <div className="mt-1.5 text-[13px] leading-snug text-teal-800">{next}</div>}
                {consent && <div className="mt-1 text-[11.5px] leading-snug text-gray-400">{consent}</div>}
              </div>
              <div className="w-[150px] shrink-0 text-right">
                <div className={`text-[13px] font-semibold leading-snug ${STATE_TONE[st.tone]}`}>{st.phrase}</div>
                {st.age && <div className="mt-0.5 font-mono text-[11px] text-gray-400">{st.age}</div>}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-3 max-w-3xl text-[11.5px] leading-relaxed text-gray-400">
        Derived at read time from connections, city leads, email, inbound texts, support@ threads and site activity.
        Nothing on this page is stored, so it cannot disagree with the events it is built from.
      </p>
    </div>
  );
}
