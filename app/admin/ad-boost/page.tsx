"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  type CampaignRequest,
  StatusBadge,
  channelLabel,
  fmtDateOnly,
  fmtTimestamp,
} from "@/components/admin/AdBoostShared";

interface TouchpointData {
  touchpoint: string;
  label: string;
  viewed: number;
  clicked: number;
  dismissed: number;
  ctr: number;
}

interface TouchpointsResponse {
  range: { from: string; to: string };
  touchpoints: TouchpointData[];
  totals: { viewed: number; clicked: number; dismissed: number };
}

export default function AdminAdBoostPage() {
  const [requests, setRequests] = useState<CampaignRequest[] | null>(null);
  const [counts, setCounts] = useState({ active: 0, archived: 0 });
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived">("active");

  // Touchpoints analytics
  const [touchpointsExpanded, setTouchpointsExpanded] = useState(false);
  const [touchpointsData, setTouchpointsData] = useState<TouchpointsResponse | null>(null);
  const [touchpointsLoading, setTouchpointsLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        view === "archived" ? "/api/admin/ad-boost?archived=1" : "/api/admin/ad-boost",
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load");
      }
      const json = await res.json();
      setRequests(json.requests as CampaignRequest[]);
      if (json.counts) setCounts(json.counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [view]);

  useEffect(() => {
    setRequests(null);
    load();
  }, [load]);

  // Load touchpoints when expanded
  useEffect(() => {
    if (!touchpointsExpanded || touchpointsData) return;
    setTouchpointsLoading(true);
    fetch("/api/admin/ad-boost/touchpoints")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setTouchpointsData(data);
        setTouchpointsLoading(false);
      })
      .catch(() => setTouchpointsLoading(false));
  }, [touchpointsExpanded, touchpointsData]);

  const tabs = [
    { value: "active" as const, label: "Active", count: counts.active },
    { value: "archived" as const, label: "Archived", count: counts.archived },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900">Ad Boost — concierge queue</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Managed-ad campaign requests from providers. Open one to set it up, advance
          its status, and copy the UTM landing URL into the ad platform.
        </p>
      </header>

      {/* Pitch Touchpoints — collapsible analytics section */}
      <div className="mb-6 rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setTouchpointsExpanded(!touchpointsExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div>
            <span className="font-medium text-gray-900">Pitch Touchpoints</span>
            <span className="ml-2 text-sm text-gray-500">
              Which surfaces drive providers to Ad Boost
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${touchpointsExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {touchpointsExpanded && (
          <div className="px-4 py-4 border-t border-gray-200">
            {touchpointsLoading ? (
              <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                Loading touchpoint data…
              </div>
            ) : touchpointsData ? (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Last 30 days · Distinct providers per touchpoint
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Touchpoint
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Viewed
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Clicked
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                          CTR
                        </th>
                        <th className="text-right py-2 pl-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Dismissed
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {touchpointsData.touchpoints.map((t) => (
                        <tr key={t.touchpoint} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5 pr-4 text-gray-900">{t.label}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">
                            {t.viewed}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">
                            {t.clicked}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-medium text-gray-900">
                            {t.viewed > 0 ? `${t.ctr}%` : "—"}
                          </td>
                          <td className="py-2.5 pl-3 text-right tabular-nums text-gray-500">
                            {t.dismissed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td className="py-2.5 pr-4 font-medium text-gray-900">Total</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium text-gray-900">
                          {touchpointsData.totals.viewed}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium text-gray-900">
                          {touchpointsData.totals.clicked}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium text-gray-900">
                          {touchpointsData.totals.viewed > 0
                            ? `${Math.round((touchpointsData.totals.clicked / touchpointsData.totals.viewed) * 100)}%`
                            : "—"}
                        </td>
                        <td className="py-2.5 pl-3 text-right tabular-nums font-medium text-gray-500">
                          {touchpointsData.totals.dismissed}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {touchpointsData.touchpoints.length === 0 && (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    No touchpoint data yet. Events will appear once providers see the pitch surfaces.
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm">Failed to load touchpoint data.</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setView(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              view === t.value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
            <span className={`text-xs ${view === t.value ? "text-white/70" : "text-gray-400"}`}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Table — fixed-width columns (only Provider flexes) so every value lines
          up exactly under its header. */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_130px_140px_170px] items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span>Provider</span>
          <span>Status</span>
          <span>Setup week</span>
          <span className="text-right">Actions</span>
        </div>

        {!requests && !error && (
          <p className="text-gray-400 text-sm px-4 py-6">Loading…</p>
        )}
        {requests && requests.length === 0 && (
          <p className="text-gray-400 text-sm px-4 py-6">
            {view === "archived" ? "No archived requests." : "No campaign requests yet."}
          </p>
        )}

        {requests?.map((r) => (
          <RequestRow key={`${r.id}-${r.updated_at}`} request={r} onChanged={load} />
        ))}
      </div>
    </div>
  );
}

function RequestRow({
  request,
  onChanged,
}: {
  request: CampaignRequest;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArchived = !!request.deleted_at;
  const name = request.display_name || request.provider_slug || request.provider_id;
  const channel = channelLabel(request.channel);

  // Soft delete / restore — flips deleted_at via POST. Reversible.
  const setArchived = async (archived: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, archived }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || (archived ? "Archive failed" : "Restore failed"));
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      setBusy(false);
    }
  };

  // Hard delete — truly removes the row. For scrubbing test runs.
  const remove = async () => {
    if (
      !window.confirm(
        `Permanently delete the Ad Boost request for ${name}? This removes the record for good and can't be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ad-boost?id=${encodeURIComponent(request.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Delete failed");
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  };

  return (
    <div className={`border-b border-gray-100 last:border-b-0 ${isArchived ? "bg-gray-50/60" : ""}`}>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_130px_140px_170px] sm:items-center gap-2 sm:gap-3 px-4 py-3">
        {/* Provider — links into the campaign detail view */}
        <div className="min-w-0">
          <Link
            href={`/admin/ad-boost/${request.id}`}
            className="font-medium text-gray-900 hover:text-primary-700 hover:underline truncate inline-block max-w-full align-bottom"
          >
            {name}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {request.completeness_at_submit ?? "—"}% complete
            {channel ? ` · ${channel}` : ""} · requested {fmtTimestamp(request.created_at)}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <StatusBadge status={request.status} />
          {isArchived && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              archived
            </span>
          )}
        </div>

        {/* Setup week */}
        <div className="text-sm text-gray-600">{fmtDateOnly(request.requested_setup_week)}</div>

        {/* Actions */}
        <div className="flex items-center justify-start sm:justify-end gap-1">
          {isArchived ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setArchived(false)}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              {busy ? "…" : "Restore"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setArchived(true)}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
            >
              {busy ? "…" : "Archive"}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
            title="Permanently delete this record"
          >
            {busy ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {error && <p className="px-4 pb-3 -mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
