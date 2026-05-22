"use client";

/**
 * MedJobs · Catchment Audit
 *
 * Per-university provider density. Sortable table for the
 * pick-the-3-MVP-Sites conversation: see at a glance which
 * universities have enough provider organizations in their defined
 * catchment to generate a meaningful Provider Prospect queue, and
 * which need upstream enrichment before activation.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Select from "@/components/ui/Select";

interface AuditRow {
  slug: string;
  name: string;
  city: string;
  state: string;
  catchment_cities: number;
  providers_in_catchment: number;
  providers_already_clients: number;
  providers_already_materialized: number;
  providers_in_states: number;
  empty_cities: Array<{ city: string; state: string }>;
  is_active_site: boolean;
}

type SortKey = "name" | "in_catchment" | "in_states" | "active";

export default function CatchmentAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("in_catchment");
  const [showEmpty, setShowEmpty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/catchment-audit");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setRows((data.rows ?? []) as AuditRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "in_states":
          return b.providers_in_states - a.providers_in_states;
        case "active":
          return (b.is_active_site ? 1 : 0) - (a.is_active_site ? 1 : 0);
        case "in_catchment":
        default:
          return b.providers_in_catchment - a.providers_in_catchment;
      }
    });
    return copy;
  }, [rows, sortBy]);

  const summary = useMemo(() => {
    const activated = rows.filter((r) => r.is_active_site).length;
    const ready = rows.filter((r) => r.providers_in_catchment >= 5).length;
    const starved = rows.filter((r) => r.providers_in_catchment === 0).length;
    return { activated, ready, starved };
  }, [rows]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          MedJobs · Catchment Audit
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Per-university provider density. Use this to pick which Sites to
          activate first — high <code>in catchment</code> = enough Provider
          Prospects to feel real on day one. Low <code>in catchment</code> +
          high <code>in states</code> = enrichment / catchment-list gap.
        </p>
      </header>

      {!loading && !error && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <Pill label="Already activated" value={summary.activated} />
          <Pill label="Ready (≥5 in catchment)" value={summary.ready} tone="emerald" />
          <Pill label="Data-starved (0 in catchment)" value={summary.starved} tone="amber" />
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[12px]">
              <input
                type="checkbox"
                checked={showEmpty}
                onChange={(e) => setShowEmpty(e.target.checked)}
              />
              Show empty-catchment universities
            </label>
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as SortKey)}
              size="sm"
              options={[
                { value: "in_catchment", label: "Sort: providers in catchment" },
                { value: "in_states", label: "Sort: providers in states" },
                { value: "active", label: "Sort: activated first" },
                { value: "name", label: "Sort: name" },
              ]}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Site</th>
                <th className="px-3 py-2 text-right">Cities</th>
                <th className="px-3 py-2 text-right">In catchment</th>
                <th className="px-3 py-2 text-right">Already clients</th>
                <th className="px-3 py-2 text-right">Materialized</th>
                <th className="px-3 py-2 text-right">In states (gap)</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRows
                .filter((r) => showEmpty || r.providers_in_catchment > 0 || r.is_active_site)
                .map((r) => (
                  <RowItem key={r.slug} row={r} />
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RowItem({ row }: { row: AuditRow }) {
  const [open, setOpen] = useState(false);
  const dense = row.providers_in_catchment >= 5;
  const empty = row.providers_in_catchment === 0;
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-3 py-2">
          <button
            onClick={() => setOpen((s) => !s)}
            className="text-left font-medium text-gray-900 hover:underline"
          >
            {row.name}
          </button>
          <p className="text-[11px] text-gray-500">
            {row.city}, {row.state} · <code>{row.slug}</code>
          </p>
        </td>
        <td className="px-3 py-2 text-right tabular-nums">{row.catchment_cities}</td>
        <td
          className={`px-3 py-2 text-right tabular-nums ${
            empty
              ? "text-amber-700"
              : dense
                ? "font-semibold text-emerald-700"
                : "text-gray-700"
          }`}
        >
          {row.providers_in_catchment}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-gray-500">
          {row.providers_already_clients}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-gray-500">
          {row.providers_already_materialized}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-gray-500">
          {row.providers_in_states}
        </td>
        <td className="px-3 py-2">
          {row.is_active_site ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Activated
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              Not active
            </span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-3 py-3 text-xs text-gray-600">
            <p className="mb-1.5 font-semibold text-gray-700">
              Catchment cities with zero providers ({row.empty_cities.length}):
            </p>
            {row.empty_cities.length === 0 ? (
              <p className="text-emerald-700">
                ✓ Every catchment city has at least one provider.
              </p>
            ) : (
              <p className="text-amber-700">
                {row.empty_cities.map((c) => `${c.city}, ${c.state}`).join(" · ")}
              </p>
            )}
            <p className="mt-2">
              <Link
                href={`/admin/medjobs/sites`}
                className="font-medium text-emerald-700 hover:underline"
              >
                Open Sites →
              </Link>{" "}
              to activate. Catchment lists are edited in{" "}
              <code>lib/staffing-outreach/partner-universities.ts</code>.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

function Pill({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: number;
  tone?: "gray" | "emerald" | "amber";
}) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`rounded-md border px-2 py-1 ${toneCls}`}>
      <span className="font-semibold tabular-nums">{value}</span>{" "}
      <span className="text-[11px]">{label}</span>
    </span>
  );
}
