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

export default function AdminAdBoostPage() {
  const [requests, setRequests] = useState<CampaignRequest[] | null>(null);
  const [counts, setCounts] = useState({ active: 0, archived: 0 });
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived">("active");

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

  const tabs = [
    { value: "active" as const, label: "Active", count: counts.active },
    { value: "archived" as const, label: "Archived", count: counts.archived },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">Ad Boost — concierge queue</h1>
            <RevenueChip requests={requests} />
          </div>
          <Link
            href="/admin/ad-boost/preview"
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Preview wrap-up moment ↗
          </Link>
        </div>
        <p className="text-gray-500 mt-1 text-sm">
          Managed-ad campaign requests from providers. Open one to set it up, advance
          its status, and copy the UTM landing URL into the ad platform.
        </p>
      </header>

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
        <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_130px_70px_140px_170px] items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span>Provider</span>
          <span>Status</span>
          <span>Leads</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_130px_70px_140px_170px] sm:items-center gap-2 sm:gap-3 px-4 py-3">
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

        {/* Status — badges wrap inside the fixed column instead of bleeding
            into Setup week when a plan badge is present. */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={request.status} />
          <PlanBadge request={request} />
          {isArchived && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              archived
            </span>
          )}
        </div>

        {/* Leads — since-launch inquiries, same number the provider sees */}
        <LeadsCell request={request} />

        {/* Setup week */}
        <div className="text-sm text-gray-600">
          <span className="sm:hidden text-gray-400">Setup week: </span>
          {fmtDateOnly(request.requested_setup_week)}
        </div>

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

/** Statuses with no campaign behind them yet. Their `delivered` is a structural
 *  zero, not a result, so we show an em dash instead of a 0 that would read as
 *  "the campaign ran and produced nothing". */
const PRE_LAUNCH_STATUSES = new Set(["pending_profile", "requested", "scheduled"]);

/** Leads on a queue row — the same delivered-families count the detail page
 *  shows under Performance and lists under "Leads (N)". Already on every row
 *  from the list API; this just surfaces it. */
function LeadsCell({ request }: { request: CampaignRequest }) {
  const preLaunch = PRE_LAUNCH_STATUSES.has(request.status);
  const leads = request.delivered ?? 0;
  const landings = request.ad_landings ?? 0;

  return (
    <div className={`text-sm tabular-nums ${preLaunch ? "text-gray-300" : "text-gray-600"}`}>
      <span className="sm:hidden font-normal text-gray-400">Leads: </span>
      {preLaunch ? "—" : leads}
      {/* Delivery signal: ad clicks that landed on the page. A live campaign
          with 0 landings after a day or two is stalled at Google, not
          unconverting — surface that here instead of a silent zero. */}
      {!preLaunch && landings > 0 && (
        <span className="block text-[11px] leading-tight text-gray-400">
          {landings} click{landings === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}

/** Paying-plan badge on a queue row — the at-a-glance revenue state.
 *  Nothing renders for never-subscribed campaigns (the common case). */
function PlanBadge({ request }: { request: CampaignRequest }) {
  if (!request.plan_status) return null;
  const style =
    request.plan_status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : request.plan_status === "past_due"
        ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-500";
  const label =
    request.plan_status === "active"
      ? `💰 $${request.plan_value ?? "?"}/mo`
      : request.plan_status === "past_due"
        ? `⚠️ past due · $${request.plan_value ?? "?"}/mo`
        : "plan canceled";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
}

/** Header tally: paying campaigns + MRR, computed from the loaded rows.
 *  Hidden until there's at least one paying plan (no zero-state noise). */
function RevenueChip({ requests }: { requests: CampaignRequest[] | null }) {
  const paying = (requests ?? []).filter(
    (r) => !r.deleted_at && (r.plan_status === "active" || r.plan_status === "past_due"),
  );
  if (paying.length === 0) return null;
  const mrr = paying.reduce((sum, r) => sum + (r.plan_value ?? 0), 0);
  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 whitespace-nowrap">
      💰 {paying.length} paying · ${mrr.toLocaleString()}/mo
    </span>
  );
}
