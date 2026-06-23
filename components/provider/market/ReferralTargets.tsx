"use client";

import { useEffect, useMemo, useState } from "react";
import type { BdTarget } from "./MarketDiagnostic";
import { getReferralGuidance } from "@/lib/market-diagnostic/referral-guidance";

const CAT_LABEL: Record<string, string> = {
  hospital: "Hospitals & ER", skilled_nursing: "Skilled nursing / rehab", hospice: "Hospice",
  assisted_living: "Assisted living", home_health: "Home health", elder_law: "Elder-law attorneys",
  senior_resource: "Senior resources", financial: "Financial advisors", faith: "Faith communities",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  to_contact: { label: "To contact", cls: "text-stone-500 bg-stone-50 border-stone-200" },
  contacted: { label: "Contacted", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  responded: { label: "Responded", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  referring: { label: "Referring", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  dismissed: { label: "Dismissed", cls: "text-stone-400 bg-stone-50 border-stone-200" },
};
const ORDER = ["to_contact", "contacted", "responded", "referring", "dismissed"];

const keyOf = (t: BdTarget) => t.id || t.name;

const POP_CSS = "@keyframes mroPop{0%{transform:scale(1)}40%{transform:scale(1.025)}100%{transform:scale(1)}}.mro-pop{animation:mroPop .55s ease-out}";

/**
 * The referral call-sheet — read-only in the admin preview, a workspace in the
 * provider portal. Each row expands to a type-specific prep card (who to ask for,
 * a ready opener, the ask, why they care) so the provider knows exactly how to
 * work that kind of source — not just a phone number. Status persists per provider
 * via /api/provider/market-outreach.
 */
export default function ReferralTargets({
  targets, interactive = false, providerName, city, refetchKey,
}: { targets: BdTarget[]; interactive?: boolean; providerName?: string; city?: string; refetchKey?: number }) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [celebrating, setCelebrating] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(() => (targets[0] ? keyOf(targets[0]) : null));
  const [copied, setCopied] = useState<string | null>(null);
  const visible = showAll ? targets : targets.slice(0, 5);

  useEffect(() => {
    if (!interactive) return;
    let cancelled = false;
    fetch("/api/provider/market-outreach")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.outreach) return;
        const next: Record<string, string> = {};
        for (const [id, v] of Object.entries(j.outreach as Record<string, { status: string }>)) next[id] = v.status;
        setStatus(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [interactive, refetchKey]);

  const update = (t: BdTarget, value: string) => {
    const prev = status[keyOf(t)] || "to_contact";
    setStatus((s) => ({ ...s, [keyOf(t)]: value })); // optimistic
    if (value === "referring" && prev !== "referring") {
      setCelebrating((c) => ({ ...c, [keyOf(t)]: true }));
      setTimeout(() => setCelebrating((c) => { const n = { ...c }; delete n[keyOf(t)]; return n; }), 700);
    }
    if (!interactive) return;
    fetch("/api/provider/market-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: keyOf(t), targetName: t.name, status: value }),
    }).catch(() => {});
  };

  const copyScript = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
    }).catch(() => {});
  };

  const { worked, referring, total } = useMemo(() => {
    let w = 0, r = 0, n = 0;
    for (const t of targets) {
      const s = status[keyOf(t)] || "to_contact";
      if (s === "dismissed") continue;
      n++;
      if (s === "contacted" || s === "responded" || s === "referring") w++;
      if (s === "referring") r++;
    }
    return { worked: w, referring: r, total: n };
  }, [targets, status]);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: POP_CSS }} />
      {interactive && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full bg-[#199087]/80 rounded-full transition-all" style={{ width: `${total ? (worked / total) * 100 : 0}%` }} />
          </div>
          <div className="text-[12px] text-stone-500 tabular-nums shrink-0">
            {worked === 0 ? "Start with your first 5" : `${worked} worked${referring ? ` · ${referring} referring` : ""}`}
          </div>
        </div>
      )}
      <div className="space-y-2">
        {visible.map((t, idx) => {
          const k = keyOf(t);
          const s = status[k] || "to_contact";
          const meta = STATUS_META[s] ?? STATUS_META.to_contact;
          const dimmed = s === "dismissed";
          const referring = s === "referring";
          const guidance = getReferralGuidance(t.cat, providerName, city);
          const isOpen = expanded === k && !!guidance;
          return (
            <div
              key={k}
              className={`rounded-2xl overflow-hidden transition-all duration-200 ${
                referring
                  ? "bg-emerald-50/50 ring-1 ring-emerald-200/70"
                  : isOpen
                    ? "bg-white shadow-[0_8px_30px_rgba(28,25,23,0.09)]"
                    : "bg-white/60 ring-1 ring-stone-200/60 hover:ring-stone-300/70"
              } ${dimmed ? "opacity-50" : ""} ${celebrating[k] ? "mro-pop" : ""}`}
            >
              <div
                className={`flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3.5 ${guidance ? "cursor-pointer" : ""}`}
                onClick={() => guidance && setExpanded(isOpen ? null : k)}
              >
                <div className="flex-1 min-w-0">
                  {idx === 0 && <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#199087] mb-0.5">Start here</div>}
                  <div className={`text-[14px] text-stone-900 truncate ${dimmed ? "line-through" : ""}`}>{t.name}</div>
                  <div className="text-[12px] text-stone-500">
                    {CAT_LABEL[t.cat] ?? t.cat} · {t.distanceMiles}mi
                    {t.phone && (
                      <> · <a href={`tel:${t.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#199087] hover:underline">{t.phone}</a></>
                    )}
                  </div>
                </div>
                {guidance && (
                  <svg className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {interactive ? (
                  <select
                    value={s}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => update(t, e.target.value)}
                    className={`shrink-0 text-[13px] font-medium rounded-full border px-2.5 py-1.5 cursor-pointer appearance-none ${meta.cls}`}
                    aria-label={`Status for ${t.name}`}
                  >
                    {ORDER.map((o) => (
                      <option key={o} value={o}>{STATUS_META[o].label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[11px] font-medium text-stone-400 shrink-0">{t.reviews} rev</span>
                )}
              </div>

              {isOpen && guidance && (
                <div className="px-5 pb-6 pt-1.5">
                  {/* Who to ask for */}
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Who to ask for</div>
                  <div className="text-[15px] font-semibold text-stone-900 mt-1">{guidance.askFor}</div>

                  {/* The script — the hero. Pure typography, one serif quote-mark detail. */}
                  <div className="relative mt-6 pl-7">
                    <span aria-hidden className="absolute left-0 -top-3 font-display text-[2.75rem] leading-none text-[#199087]/30 select-none">&ldquo;</span>
                    <p className="text-[15.5px] text-stone-700 leading-[1.75]">{guidance.opener}</p>
                    <button
                      type="button"
                      onClick={() => copyScript(guidance.opener, k)}
                      className="mt-3 text-[12px] font-medium text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {copied === k ? "Copied ✓" : "Copy script"}
                    </button>
                  </div>

                  {/* Supporting — quiet eyebrow, readable value */}
                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Your ask</div>
                      <div className="text-[13px] text-stone-600 mt-1 leading-relaxed">{guidance.ask}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Why it works</div>
                      <div className="text-[13px] text-stone-600 mt-1 leading-relaxed">{guidance.whyCare}</div>
                    </div>
                  </div>

                  {/* The one primary action */}
                  {t.phone && (
                    <a
                      href={`tel:${t.phone}`}
                      className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-[#199087] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:bg-[#147a72] hover:shadow-[0_5px_16px_rgba(25,144,135,0.32)] hover:-translate-y-px active:translate-y-0 transition-all"
                    >
                      Call {t.phone} <span aria-hidden>→</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {targets.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-[13px] font-medium text-[#199087] hover:text-[#147a72] transition-colors"
        >
          {showAll ? "Show fewer ↑" : `Show all ${targets.length} referral sources →`}
        </button>
      )}
    </div>
  );
}
