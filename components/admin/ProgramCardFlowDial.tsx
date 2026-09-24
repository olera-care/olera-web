"use client";

/**
 * Live traffic dial for the program-page card flow experiment
 * (control vs three_tap). Same behavior as the other allocation dials in
 * /admin/analytics: integer percentages summing to 100, a save bumps the
 * version and reshuffles returning visitors, "Preview" opens a program page
 * with the arm forced via ?card_flow=.
 */

import { useEffect, useState } from "react";
import { PROGRAM_CARD_FLOWS, type ProgramCardFlow } from "@/lib/analytics/program-card-variant";

const LABELS: Record<ProgramCardFlow, { title: string; sub: string }> = {
  control: { title: "Control", sub: "Today's seven questions, ends at \"check your inbox\"" },
  three_tap: { title: "Three taps", sub: "Who, household, one income question, then the answer and the call" },
};

const PREVIEW_PATH = "/benefits/texas/liheap-energy-assistance";

export default function ProgramCardFlowDial() {
  const [loaded, setLoaded] = useState(false);
  const [weights, setWeights] = useState<Record<ProgramCardFlow, number>>({ control: 50, three_tap: 50 });
  const [saved, setSaved] = useState<Record<ProgramCardFlow, number>>({ control: 50, three_tap: 50 });
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/analytics/program-card-variant-weights", { cache: "no-store" })
      .then(async (r) => {
        if (cancelled) return;
        const data = r.ok ? await r.json().catch(() => null) : null;
        if (!data) {
          setFeedback({ kind: "err", msg: `Failed to load current allocation (${r.status}).` });
        } else {
          const w = (data.weights ?? {}) as Partial<Record<ProgramCardFlow, number>>;
          const merged = Object.fromEntries(
            PROGRAM_CARD_FLOWS.map((v) => [v, typeof w[v] === "number" ? (w[v] as number) : 0]),
          ) as Record<ProgramCardFlow, number>;
          setWeights(merged);
          setSaved(merged);
          setVersion(typeof data.version === "number" ? data.version : 0);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setFeedback({ kind: "err", msg: "Network error loading allocation. Try refreshing." });
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sum = PROGRAM_CARD_FLOWS.reduce((s, v) => s + (weights[v] || 0), 0);
  const dirty = PROGRAM_CARD_FLOWS.some((v) => weights[v] !== saved[v]);
  const canSave = loaded && sum === 100 && dirty && !saving;

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/analytics/program-card-variant-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({ kind: "err", msg: body?.error || `Save failed (${res.status})` });
      } else {
        setSaved(weights);
        setVersion(typeof body?.version === "number" ? body.version : version + 1);
        setFeedback({ kind: "ok", msg: "Saved. Returning visitors reshuffle on their next visit." });
      }
    } catch {
      setFeedback({ kind: "err", msg: "Network error. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-2">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Traffic allocation</div>
        <div className="text-[11px] text-gray-400 tabular-nums">v{version}</div>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        What happens in the program-page card after the email is saved. The page, the button and the email step are the same in both arms.
      </p>
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {PROGRAM_CARD_FLOWS.map((v) => (
          <label key={v} className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span className="text-[11px] font-medium text-gray-700">{LABELS[v].title}</span>
            <span className="text-[10px] text-gray-400 leading-tight">{LABELS[v].sub}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                disabled={!loaded || saving}
                value={weights[v]}
                onChange={(e) => {
                  const n = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) return;
                  setWeights((prev) => ({ ...prev, [v]: Math.max(0, Math.min(100, n)) }));
                }}
                className="w-16 text-right tabular-nums text-base font-medium text-gray-900 bg-transparent border-b border-gray-200 focus:border-gray-900 focus:outline-none disabled:opacity-50"
              />
              <span className="text-xs text-gray-400">%</span>
              <a
                href={`${PREVIEW_PATH}?card_flow=${v}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] text-gray-400 hover:text-gray-700 underline underline-offset-2"
              >
                Preview ↗
              </a>
            </div>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`text-[12px] tabular-nums px-2 py-0.5 rounded ${
            sum === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          Sum: {sum} / 100
        </span>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            canSave ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : "Save allocation"}
        </button>
        {feedback && (
          <span className={`text-[11px] ${feedback.kind === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
            {feedback.msg}
          </span>
        )}
      </div>
    </div>
  );
}
