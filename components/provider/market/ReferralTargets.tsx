"use client";

import { useEffect, useMemo, useState } from "react";
import type { BdTarget } from "./MarketDiagnostic";

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

/**
 * The referral call-sheet — read-only in the admin preview, a workspace in the
 * provider portal: each target carries a status the provider works through
 * (To contact → Contacted → Responded → Referring). Persists per provider via
 * /api/provider/market-outreach; optimistic + in-session fallback if the table
 * migration (097) isn't applied yet.
 */
const POP_CSS = "@keyframes mroPop{0%{transform:scale(1)}40%{transform:scale(1.025)}100%{transform:scale(1)}}.mro-pop{animation:mroPop .55s ease-out}";

export default function ReferralTargets({ targets, interactive = false }: { targets: BdTarget[]; interactive?: boolean }) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [celebrating, setCelebrating] = useState<Record<string, boolean>>({});

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
  }, [interactive]);

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
            {worked} of {total} worked{referring ? ` · ${referring} referring` : ""}
          </div>
        </div>
      )}
      <div className="space-y-2">
        {targets.map((t) => {
          const s = status[keyOf(t)] || "to_contact";
          const meta = STATUS_META[s] ?? STATUS_META.to_contact;
          const dimmed = s === "dismissed";
          const referring = s === "referring";
          return (
            <div
              key={keyOf(t)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
                referring ? "border-emerald-200/80 bg-emerald-50/40" : "border-stone-200/70 bg-white/50"
              } ${dimmed ? "opacity-50" : ""} ${celebrating[keyOf(t)] ? "mro-pop" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-[14px] text-stone-900 truncate ${dimmed ? "line-through" : ""}`}>{t.name}</div>
                <div className="text-[12px] text-stone-500">
                  {CAT_LABEL[t.cat] ?? t.cat} · {t.distanceMiles}mi
                  {t.phone && (
                    <> · <a href={`tel:${t.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#199087] hover:underline">{t.phone}</a></>
                  )}
                </div>
              </div>
              {interactive ? (
                <select
                  value={s}
                  onChange={(e) => update(t, e.target.value)}
                  className={`shrink-0 text-[12px] font-medium rounded-full border px-2.5 py-1 cursor-pointer appearance-none ${meta.cls}`}
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
          );
        })}
      </div>
    </div>
  );
}
