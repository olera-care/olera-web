"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  type CampaignRequest,
  STATUS_LABELS,
  StatusBadge,
  PhotoReadinessBadge,
  adBudgetLabel,
  channelLabel,
  fmtDateOnly,
  fmtTimestamp,
  fmtMetricsAge,
} from "@/components/admin/AdBoostShared";
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
  const visibleRequests = requests
    ? [...requests]
        .filter((request) =>
          statusFilter === "attention"
            ? nextActionById.get(request.id)?.level === "attention"
            : statusFilter
              ? request.status === statusFilter
              : true,
        )
        .sort(
          (a, b) =>
            (nextActionById.get(a.id)?.priority ?? 99) -
            (nextActionById.get(b.id)?.priority ?? 99),
        )
    : requests;

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
            See what providers see ↗
          </Link>
        </div>
        <p className="text-gray-500 mt-1 text-sm">
          Managed-ad campaign requests from providers. Open one to set it up, advance
          its status, and copy the UTM landing URL into the ad platform.{" "}
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

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setView(t.value);
              setStatusFilter(null);
            }}
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

      {/* Status filter — chips only for statuses present in the loaded list,
          so the row stays as small as the data allows. */}
      {(statusChips.length > 1 || attentionCount > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => setStatusFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === null
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {attentionCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "attention" ? null : "attention")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
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
          {statusChips.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(statusFilter === st ? null : st)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {STATUS_LABELS[st] ?? st}
              <span className={statusFilter === st ? "ml-1 text-white/60" : "ml-1 text-gray-400"}>
                {statusCounts.get(st)}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Table — fixed-width columns (only Provider flexes) so every value lines
          up exactly under its header. */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[minmax(160px,1fr)_125px_155px_78px_70px_50px_105px_60px] items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span>Provider</span>
          <span>Status</span>
          <span>Next move</span>
          <span>Landed</span>
          <span>Questions</span>
          <span>Leads</span>
          <span>Flight</span>
          <span className="text-right">Actions</span>
        </div>

        {!requests && !error && (
          <p className="text-gray-400 text-sm px-4 py-6">Loading…</p>
        )}
        {visibleRequests && visibleRequests.length === 0 && (
          <p className="text-gray-400 text-sm px-4 py-6">
            {statusFilter
              ? statusFilter === "attention"
                ? "No campaigns currently need attention."
                : `No ${(STATUS_LABELS[statusFilter] ?? statusFilter).toLowerCase()} requests.`
              : view === "archived"
                ? "No archived requests."
                : "No campaign requests yet."}
          </p>
        )}

        {visibleRequests?.map((r) => (
          <RequestRow
            key={`${r.id}-${r.updated_at}`}
            request={r}
            nextAction={nextActionById.get(r.id) ?? getAdBoostNextAction(r)}
            onChanged={load}
          />
        ))}
      </div>
    </div>
  );
}

function RequestRow({
  request,
  nextAction,
  onChanged,
}: {
  request: CampaignRequest;
  nextAction: AdBoostNextAction;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArchived = !!request.deleted_at;
  const metricsAge = fmtMetricsAge(request.metrics_updated_at);
  const name = request.display_name || request.provider_slug || request.provider_id;
  const channel = channelLabel(request.channel);
  const configuredBudget = adBudgetLabel(request.ad_budget_cents, request.ad_budget_type);
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
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(160px,1fr)_125px_155px_78px_70px_50px_105px_60px] lg:items-center gap-2 lg:gap-3 px-4 py-3">
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
          {!["live", "ended", "cancelled"].includes(request.status) && (
            <PhotoReadinessBadge status={request.photo_readiness_status} />
          )}
          <PlanBadge request={request} />
          {isArchived && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              archived
            </span>
          )}
        </div>

        <NextMoveCell action={nextAction} />

        {/* Two different measurements, never one standing in for the other.
            The big number is OURS: session-deduped managed-UTM landings,
            internal traffic stripped, always current. The small line is the
            operator-entered ad-platform figure, which is only as fresh as the
            last time someone typed it in.

            They are close but not interchangeable — a platform click that
            bounces before our JS runs is a click with no landing, and one
            click can spawn two sessions. The old code chained them with `??`,
            so a typed 0 (a real value, not null) permanently masked live
            landings: Rosemonte read "0 clicks" against 10 real ones.

            Campaigns that flew before the managed-UTM instrumentation
            (2026-07-22) legitimately land on 0 here; their platform line is
            the only history there is. */}
        <MetricCell
          request={request}
          value={request.ad_landings ?? 0}
          label="Landed"
          detail={
            request.ad_clicks != null ? `${request.ad_clicks} platform` : undefined
          }
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
        <MetricCell
          request={request}
          value={request.delivered ?? 0}
          label="Leads"
          emphasize
        />

        {/* Flight — actual ad-platform dates when known, with the provider's
            requested setup week as the legacy fallback. */}
        <div className="text-sm text-gray-600">
          <span className="lg:hidden text-gray-400">Flight: </span>
          {fmtDateOnly(request.flight_start_date ?? request.requested_setup_week)}
          {request.flight_end_date && (
            <span className="block text-[11px] leading-tight text-gray-400">
              ends {fmtDateOnly(request.flight_end_date)}
            </span>
          )}
          {configuredBudget && (
            <span className="block text-[11px] leading-tight text-gray-400">
              {configuredBudget}
            </span>
          )}
        </div>

        {/* Actions — icon-only with the browser's delayed tooltip (title) as
            the long-hover label. Red appears only on trash hover so the
            destructive action stops being the loudest element in every row. */}
        <div className="flex items-center justify-start lg:justify-end gap-0.5">
          {isArchived ? (
            <IconAction
              label="Restore from archive"
              onClick={() => setArchived(false)}
              busy={busy}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </IconAction>
          ) : (
            <IconAction
              label="Archive (hide from queue, reversible)"
              onClick={() => setArchived(true)}
              busy={busy}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </IconAction>
          )}
          <IconAction
            label="Delete permanently"
            onClick={remove}
            busy={busy}
            danger
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </IconAction>
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
      <span className="lg:hidden text-xs text-gray-400">Next: </span>
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
      <span className="lg:hidden font-normal text-gray-400">{label}: </span>
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
