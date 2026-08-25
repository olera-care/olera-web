"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  type CampaignRequest,
  STATUS_LABELS,
  StatusBadge,
  PhotoReadinessBadge,
  adBudgetLabel,
  fmtDateOnly,
  fmtTimestamp,
  fmtMetricsAge,
} from "@/components/admin/AdBoostShared";
import {
  type AdBoostPlatform,
  type AdBoostQueueSort,
  type ProviderCampaignGroup,
  buildProviderCampaignGroups,
  platformsForChannel,
} from "@/components/admin/ad-boost-queue";
import {
  type AdBoostNextAction,
  getAdBoostNextAction,
} from "@/lib/ad-boost/admin-communications";

export default function AdminAdBoostPage() {
  const [requests, setRequests] = useState<CampaignRequest[] | null>(null);
  const [counts, setCounts] = useState({ active: 0, archived: 0 });
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived">("active");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<AdBoostQueueSort>("priority");
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    () => new Set(),
  );

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
    { value: "active" as const, label: "Queue", count: counts.active },
    { value: "archived" as const, label: "Archived", count: counts.archived },
  ];

  // Status chips are built from the loaded rows (only statuses that exist),
  // so the row stays as small as the data allows. Client-side filter — the
  // list API already returns everything.
  const statusCounts = new Map<string, number>();
  for (const r of requests ?? []) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  }
  const statusChips = Object.keys(STATUS_LABELS).filter((st) => statusCounts.has(st));
  const nextActionById = useMemo(
    () => new Map((requests ?? []).map((request) => [request.id, getAdBoostNextAction(request)])),
    [requests],
  );
  const attentionCount = (requests ?? []).filter(
    (request) => nextActionById.get(request.id)?.level === "attention",
  ).length;
  const providerGroups = useMemo(
    () =>
      requests
        ? buildProviderCampaignGroups({
            requests,
            statusFilter,
            nextActionById,
            sort,
          })
        : null,
    [nextActionById, requests, sort, statusFilter],
  );
  const visibleCampaignCount =
    providerGroups?.reduce((count, group) => count + group.requests.length, 0) ?? 0;

  const toggleProvider = (providerId: string) => {
    setExpandedProviders((current) => {
      const next = new Set(current);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">Ad Boost — provider queue</h1>
            <RevenueChip requests={requests} />
          </div>
          <Link
            href="/admin/ad-boost/preview"
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            See what providers see ↗
          </Link>
        </div>
        <p className="text-gray-500 mt-1 text-sm">
          One provider, one continuous campaign history. Expand a provider to work
          individual campaigns, advance their status, and copy the UTM landing URL.{" "}
          <Link
            href="/admin/automations/ad-boost"
            className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-primary-700 transition-colors hover:text-primary-800"
            title="Open the Ad Boost messaging cascade in Automations"
          >
            View messaging journey
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <span className="mx-1.5 text-gray-300" aria-hidden="true">·</span>
          <Link
            href="/admin/analytics?ad_boost_funnel=1#ad-boost-purchase-funnel"
            className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-primary-700 transition-colors hover:text-primary-800"
            title="Open the expanded Ad Boost purchase funnel in Analytics"
          >
            View purchase analytics
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setView(tab.value);
                setStatusFilter(null);
                setExpandedProviders(new Set());
              }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                view === tab.value
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span className={`text-xs ${view === tab.value ? "text-white/70" : "text-gray-400"}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>
        {providerGroups && (
          <p className="text-xs text-gray-400" aria-live="polite">
            {providerGroups.length} provider{providerGroups.length === 1 ? "" : "s"}
            {" · "}
            {visibleCampaignCount} campaign{visibleCampaignCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(statusChips.length > 1 || attentionCount > 0) && (
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === null
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All
            </button>
          )}
          {attentionCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "attention" ? null : "attention")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === "attention"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Needs attention
              <span className={statusFilter === "attention" ? "ml-1 text-white/70" : "ml-1 text-amber-500"}>
                {attentionCount}
              </span>
            </button>
          )}
          {statusChips.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {STATUS_LABELS[status] ?? status}
              <span className={statusFilter === status ? "ml-1 text-white/60" : "ml-1 text-gray-400"}>
                {statusCounts.get(status)}
              </span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as AdBoostQueueSort)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
          >
            <option value="priority">Operational priority</option>
            <option value="newest">Newest submitted</option>
            <option value="oldest">Oldest submitted</option>
          </select>
        </label>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="hidden xl:grid grid-cols-[minmax(145px,1.45fr)_95px_100px_minmax(120px,1.15fr)_50px_50px_44px_88px_48px] items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span>Provider</span>
          <span>Platforms</span>
          <span>Status</span>
          <span>Next move</span>
          <span className="text-right">Landed</span>
          <span className="text-right">Questions</span>
          <span className="text-right">Leads</span>
          <span>Submitted</span>
          <span className="text-right">Actions</span>
        </div>

        {!requests && !error && <p className="px-4 py-6 text-sm text-gray-400">Loading…</p>}
        {providerGroups && providerGroups.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400">
            {statusFilter
              ? statusFilter === "attention"
                ? "No campaigns currently need attention."
                : `No ${(STATUS_LABELS[statusFilter] ?? statusFilter).toLowerCase()} requests.`
              : view === "archived"
                ? "No archived requests."
                : "No campaign requests yet."}
          </p>
        )}

        {providerGroups?.map((group) => (
          <ProviderGroupRow
            key={group.providerId}
            group={group}
            expanded={expandedProviders.has(group.providerId)}
            statusFilter={statusFilter}
            nextActionById={nextActionById}
            onToggle={() => toggleProvider(group.providerId)}
            onChanged={load}
          />
        ))}
      </div>
    </div>
  );
}

function ProviderGroupRow({
  group,
  expanded,
  statusFilter,
  nextActionById,
  onToggle,
  onChanged,
}: {
  group: ProviderCampaignGroup;
  expanded: boolean;
  statusFilter: string | null;
  nextActionById: Map<string, AdBoostNextAction>;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const request = group.primaryRequest;
  const nextAction = nextActionById.get(request.id) ?? getAdBoostNextAction(request);
  const name =
    group.latestRequest.display_name ||
    group.latestRequest.provider_slug ||
    group.providerId;
  const hasHistory = group.totalRequestCount > 1;
  const campaignCountLabel =
    statusFilter && group.requests.length !== group.totalRequestCount
      ? `${group.requests.length} of ${group.totalRequestCount} campaigns`
      : `${group.totalRequestCount} campaigns`;
  const allPreLaunch = group.requests.every((campaign) =>
    PRE_LAUNCH_STATUSES.has(campaign.status),
  );

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="grid grid-cols-1 gap-2 px-4 py-3.5 hover:bg-gray-50/60 xl:grid-cols-[minmax(145px,1.45fr)_95px_100px_minmax(120px,1.15fr)_50px_50px_44px_88px_48px] xl:items-center xl:px-3">
        <div className="min-w-0">
          <Link
            href={`/admin/ad-boost/${request.id}`}
            className="inline-block max-w-full truncate align-bottom font-medium text-gray-900 hover:text-primary-700 hover:underline"
          >
            {name}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
            <span>{group.latestRequest.completeness_at_submit ?? "—"}% complete</span>
            {hasHistory && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                {campaignCountLabel}
              </span>
            )}
          </p>
        </div>

        <PlatformBadges platforms={group.platforms} />

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={request.status} />
          {!["live", "ended", "cancelled"].includes(request.status) && (
            <PhotoReadinessBadge status={request.photo_readiness_status} />
          )}
          <PlanBadge request={request} />
          {!!request.deleted_at && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              archived
            </span>
          )}
          {hasHistory && <StatusSummary requests={group.requests} />}
        </div>

        <NextMoveCell action={nextAction} />
        <SummaryMetricCell value={group.totals.landed} label="Landed" dash={allPreLaunch} />
        <SummaryMetricCell value={group.totals.questions} label="Questions" dash={allPreLaunch} />
        <SummaryMetricCell value={group.totals.leads} label="Leads" dash={allPreLaunch} emphasize />

        <div className="text-sm text-gray-600">
          <span className="text-gray-400 xl:hidden">Submitted: </span>
          {fmtTimestamp(group.latestRequest.created_at)}
          {hasHistory && (
            <span className="block text-[11px] leading-tight text-gray-400">
              {statusFilter ? "latest matching campaign" : "latest campaign"}
            </span>
          )}
        </div>

        {hasHistory ? (
          <div className="flex justify-start xl:justify-end">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} campaign history for ${name}`}
              title={`${expanded ? "Collapse" : "Expand"} campaign history`}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={expanded ? "m4.5 15.75 7.5-7.5 7.5 7.5" : "m19.5 8.25-7.5 7.5-7.5-7.5"} />
              </svg>
            </button>
          </div>
        ) : (
          <CampaignActions request={request} name={name} onChanged={onChanged} />
        )}
      </div>

      {hasHistory && expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60">
          {group.requests.map((campaign) => (
            <CampaignRow
              key={`${campaign.id}-${campaign.updated_at}`}
              request={campaign}
              nextAction={nextActionById.get(campaign.id) ?? getAdBoostNextAction(campaign)}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignRow({
  request,
  nextAction,
  onChanged,
}: {
  request: CampaignRequest;
  nextAction: AdBoostNextAction;
  onChanged: () => void;
}) {
  const name = request.display_name || request.provider_slug || request.provider_id;
  const metricsAge = fmtMetricsAge(request.metrics_updated_at);
  const configuredBudget = adBudgetLabel(request.ad_budget_cents, request.ad_budget_type);

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-gray-100 px-4 py-3 last:border-b-0 xl:grid-cols-[minmax(145px,1.45fr)_95px_100px_minmax(120px,1.15fr)_50px_50px_44px_88px_48px] xl:items-center xl:px-3 xl:pl-6">
      <div className="min-w-0">
        <Link
          href={`/admin/ad-boost/${request.id}`}
          className="text-sm font-medium text-gray-800 hover:text-primary-700 hover:underline"
        >
          Campaign submitted {fmtTimestamp(request.created_at)}
        </Link>
        <p className="mt-0.5 text-[11px] leading-tight text-gray-400">
          Flight {fmtDateOnly(request.flight_start_date ?? request.requested_setup_week)}
          {request.flight_end_date ? `–${fmtDateOnly(request.flight_end_date)}` : ""}
          {configuredBudget ? ` · ${configuredBudget}` : ""}
        </p>
      </div>

      <PlatformBadges platforms={platformsForChannel(request.channel)} />

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={request.status} />
        {!["live", "ended", "cancelled"].includes(request.status) && (
          <PhotoReadinessBadge status={request.photo_readiness_status} />
        )}
        <PlanBadge request={request} />
        {!!request.deleted_at && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
            archived
          </span>
        )}
      </div>

      <NextMoveCell action={nextAction} />

      <MetricCell
        request={request}
        value={request.ad_landings ?? 0}
        label="Landed"
        detail={request.ad_clicks != null ? `${request.ad_clicks} platform` : undefined}
        title={
          request.ad_clicks != null
            ? `${request.ad_landings ?? 0} managed-UTM landings measured on the page (internal traffic excluded) · ${request.ad_clicks} clicks reported by the ad platform, entered by hand ${
                metricsAge ? `on ${metricsAge.label}` : "(no entry date recorded)"
              }`
            : "Managed-UTM landings measured on the page (internal traffic excluded). No ad-platform metrics entered yet."
        }
      />
      <MetricCell
        request={request}
        value={request.questions_received ?? 0}
        label="Questions"
        detail={
          (request.question_topics ?? 0) < (request.questions_received ?? 0)
            ? `${request.question_topics ?? 0} topics`
            : undefined
        }
      />
      <MetricCell request={request} value={request.delivered ?? 0} label="Leads" emphasize />

      <div className="text-sm text-gray-600">
        <span className="text-gray-400 xl:hidden">Submitted: </span>
        {fmtTimestamp(request.created_at)}
      </div>

      <CampaignActions request={request} name={name} onChanged={onChanged} />
    </div>
  );
}

function CampaignActions({
  request,
  name,
  onChanged,
}: {
  request: CampaignRequest;
  name: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isArchived = !!request.deleted_at;

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
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || (archived ? "Archive failed" : "Restore failed"));
      }
      onChanged();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed");
      setBusy(false);
    }
  };

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
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Delete failed");
      }
      onChanged();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Delete failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-start gap-0.5 xl:justify-end">
        {isArchived ? (
          <IconAction label="Restore from archive" onClick={() => setArchived(false)} busy={busy}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </IconAction>
        ) : (
          <IconAction label="Archive (hide from queue, reversible)" onClick={() => setArchived(true)} busy={busy}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </IconAction>
        )}
        <IconAction label="Delete permanently" onClick={remove} busy={busy} danger>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </IconAction>
      </div>
      {error && (
        <p className="mt-1 truncate text-[10px] text-red-600" title={error}>
          {error}
        </p>
      )}
    </div>
  );
}

function PlatformBadges({ platforms }: { platforms: AdBoostPlatform[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {platforms.map((platform) => {
        const style =
          platform === "google"
            ? "bg-blue-50 text-blue-700"
            : platform === "meta"
              ? "bg-indigo-50 text-indigo-700"
              : platform === "nextdoor"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500";
        const label =
          platform === "google"
            ? "Google"
            : platform === "meta"
              ? "Meta"
              : platform === "nextdoor"
                ? "Nextdoor"
                : "Unassigned";
        return (
          <span key={platform} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${style}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {label}
          </span>
        );
      })}
    </div>
  );
}

function StatusSummary({ requests }: { requests: CampaignRequest[] }) {
  const counts = new Map<string, number>();
  for (const request of requests) {
    counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
  }
  return (
    <span className="basis-full text-[11px] leading-tight text-gray-400">
      {[...counts.entries()]
        .map(([status, count]) => `${count} ${(STATUS_LABELS[status] ?? status).toLowerCase()}`)
        .join(" · ")}
    </span>
  );
}

function SummaryMetricCell({
  value,
  label,
  dash,
  emphasize,
}: {
  value: number;
  label: string;
  dash: boolean;
  emphasize?: boolean;
}) {
  const tone = dash || value === 0
    ? "text-gray-300"
    : emphasize
      ? "font-semibold text-primary-700"
      : "text-gray-700";
  return (
    <div className={`text-sm tabular-nums xl:text-right ${tone}`}>
      <span className="font-normal text-gray-400 xl:hidden">{label}: </span>
      {dash ? "—" : value.toLocaleString()}
    </div>
  );
}

/** Statuses with no campaign behind them yet. Their `delivered` is a structural
 *  zero, not a result, so we show an em dash instead of a 0 that would read as
 *  "the campaign ran and produced nothing". */
const PRE_LAUNCH_STATUSES = new Set(["pending_profile", "requested", "scheduled"]);

/** Icon-only row action. The accessible name lives in aria-label; `title`
 *  gives the browser's built-in delayed tooltip — hover ~1s and the full
 *  label appears, no custom tooltip machinery. */
function IconAction({
  label,
  onClick,
  busy,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 transition-colors disabled:opacity-40 ${
        danger
          ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
          : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
      } ${busy ? "animate-pulse" : ""}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function NextMoveCell({ action }: { action: AdBoostNextAction }) {
  const labelTone =
    action.level === "attention"
      ? "text-amber-800"
      : action.level === "healthy"
        ? "text-teal-700"
        : action.level === "done"
          ? "text-gray-500"
          : "text-gray-700";
  return (
    <div className="min-w-0">
      <span className="xl:hidden text-xs text-gray-400">Next: </span>
      <span className={`text-xs font-semibold ${labelTone}`}>{action.label}</span>
      <span className="mt-0.5 block truncate text-[11px] leading-tight text-gray-400" title={action.detail}>
        {action.detail}
      </span>
    </div>
  );
}

/** A familiar, fully labeled funnel metric. Pre-launch values remain
 * structural dashes rather than misleading zero-performance results. */
function MetricCell({
  request,
  value,
  label,
  emphasize,
  detail,
  title,
}: {
  request: CampaignRequest;
  value: number;
  label: string;
  emphasize?: boolean;
  detail?: string;
  /** Long-hover explanation — used where a cell carries two measurements and
   *  the difference between them matters. */
  title?: string;
}) {
  const preLaunch = PRE_LAUNCH_STATUSES.has(request.status);
  const tone = preLaunch || value === 0
    ? "text-gray-300"
    : emphasize
      ? "font-semibold text-primary-700"
      : "text-gray-700";
  return (
    <div className={`text-sm tabular-nums ${tone}`} title={title}>
      <span className="xl:hidden font-normal text-gray-400">{label}: </span>
      {preLaunch ? "—" : value.toLocaleString()}
      {!preLaunch && detail && (
        <span className="block text-[10px] font-normal leading-tight text-gray-400">
          {detail}
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
