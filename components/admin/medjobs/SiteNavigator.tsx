"use client";

import { useEffect, useMemo, useState } from "react";
import HealthBadge from "@/components/admin/medjobs/HealthBadge";
import type { Health } from "@/lib/medjobs/funnel-health";

/**
 * The site-health navigator: every site, worst health first, so the operator's
 * first question — which site needs attention right now — is answered without
 * reading anything else. Clicking a row filters the architecture to it.
 */

interface Row {
  slug: string;
  name: string;
  logoUrl: string | null;
  score: number;
  status: Health;
  reads: string;
}

/** The school's mark, or its initials while no logo is loaded. */
function Mark({ row }: { row: Row }) {
  if (row.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={row.logoUrl} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />;
  }
  const initials = row.name.replace(/^(The|University of)\s+/i, "").slice(0, 2).toUpperCase();
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary-100 text-[10px] font-bold text-primary-800">
      {initials}
    </span>
  );
}

const BAR: Record<Health, string> = {
  red: "bg-error-500",
  yellow: "bg-warning-500",
  green: "bg-success-500",
  unscored: "bg-gray-300",
};

export default function SiteNavigator({
  active,
  onPick,
}: {
  /** Currently filtered site slug, or null for all sites. */
  active: string | null;
  onPick: (slug: string | null) => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/medjobs/site-health")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { sites: Row[] }) => !cancelled && setRows(d.sites))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return needle ? rows.filter((r) => r.name.toLowerCase().includes(needle)) : rows;
  }, [rows, q]);

  return (
    <aside className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <h2 className="text-sm font-semibold text-gray-900">Site health</h2>
        <p className="text-xs text-gray-500">Worst first</p>
      </div>

      <div className="px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter universities"
          aria-label="Filter universities"
          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => onPick(null)}
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors ${
          active === null ? "bg-primary-50 font-semibold text-primary-900" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        All sites
        <span className="text-[11px] text-gray-400">{rows?.length ?? ""}</span>
      </button>

      <div className="max-h-[26rem] overflow-y-auto border-t border-gray-100">
        {failed ? (
          <p className="px-3 py-4 text-xs text-gray-500">Site health could not be loaded.</p>
        ) : !rows ? (
          <p className="px-3 py-4 text-xs text-gray-500">Scoring sites…</p>
        ) : shown.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-500">No university matches that.</p>
        ) : (
          shown.map((r) => (
            <button
              key={r.slug}
              type="button"
              title={r.reads}
              onClick={() => onPick(r.slug)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                active === r.slug ? "bg-primary-50" : "hover:bg-gray-50"
              }`}
            >
              {/* The bar carries the status at a glance; the number is the detail. */}
              <span className={`h-8 w-1 shrink-0 rounded-full ${BAR[r.status]}`} aria-hidden />
              <Mark row={r} />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] ${
                    active === r.slug ? "font-semibold text-primary-900" : "text-gray-800"
                  }`}
                >
                  {r.name}
                </span>
                <span className="block text-[11px] text-gray-500">
                  {r.status === "unscored" ? "not scored" : `${r.score} / 100`}
                </span>
              </span>
              <HealthBadge status={r.status} />
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
