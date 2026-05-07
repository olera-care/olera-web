"use client";

/**
 * v9.0 Phase 7 Commit E: Logs page — analytics + history + charting
 * surface for MedJobs.
 *
 * The In Basket stays operational/calm/throughput-oriented (no charts);
 * Logs is the analytics layer. PulseHeader at the top (single metric
 * default, with a multi-series picker for funnel comparisons), then
 * the touchpoint feed below as the searchable history.
 *
 * Chart metric defaults to "activity" — the catch-all touchpoint count.
 * Multi-series picker (CHART_SERIES_OPTIONS) lets admin compose a
 * chart with multiple metrics on one X-axis (signups vs candidates vs
 * partners, etc.). When ≥1 series is checked, the chart switches to
 * a multi-line `metric=custom&series=…` view.
 *
 * Internal API (/api/admin/medjobs/completed-work) keeps its name —
 * UI rename is "Completed Work" → "Logs" only.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import {
  CompletedTaskCard,
  type CompletedTaskRow,
} from "@/components/admin/medjobs/cards/CompletedTaskCard";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import { resolveRange } from "@/components/admin/DateRangePopover";
import { CHART_SERIES_OPTIONS } from "@/lib/student-outreach/tab-config";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

type TypeFilter = "all" | "calls" | "emails" | "meetings" | "replies" | "notes";

const TYPE_FILTERS: Array<{ key: TypeFilter; label: string; types: ReadonlySet<string> }> = [
  { key: "all",      label: "All",      types: new Set() },
  { key: "calls",    label: "Calls",    types: new Set(["call_no_answer", "call_voicemail", "call_connected", "call_wrong_number"]) },
  { key: "emails",   label: "Emails",   types: new Set(["email_sent"]) },
  { key: "meetings", label: "Meetings", types: new Set(["meeting_scheduled", "meeting_held", "meeting_no_show", "meeting_rescheduled"]) },
  { key: "replies",  label: "Replies",  types: new Set(["email_replied", "ig_dm_replied"]) },
  { key: "notes",    label: "Notes",    types: new Set(["note_added"]) },
];

// v9.0 Phase 7 Commit P: source filter narrows the unified Logs feed
// to one entity type. Entity pages link to /admin/medjobs/logs?source=
// <kind> so admin lands here pre-filtered for the entity they came
// from. Stakeholder = student_outreach touchpoints (Prospects /
// Replies / Meetings / Calls / Partners).
type SourceFilter = "all" | "stakeholder" | "client" | "candidate" | "site";

const SOURCE_FILTERS: Array<{ key: SourceFilter; label: string }> = [
  { key: "all",         label: "All entities" },
  { key: "stakeholder", label: "Stakeholders" },
  { key: "client",      label: "Clients" },
  { key: "candidate",   label: "Candidates" },
  { key: "site",        label: "Sites" },
];

export default function LogsPage() {
  const searchParams = useSearchParams();
  const sourceParam = searchParams?.get("source");
  const initialSource: SourceFilter =
    sourceParam === "stakeholder" ||
    sourceParam === "client" ||
    sourceParam === "candidate" ||
    sourceParam === "site"
      ? sourceParam
      : "all";

  const [rows, setRows] = useState<CompletedTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });
  const [chartSeries, setChartSeries] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(initialSource);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);
  // v9.0 Phase 7 Commit O: Logs feed is unified — entity-task
  // completions can also surface here. Each gets its own drawer mode.
  const [openProviderId, setOpenProviderId] = useState<string | null>(null);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
  const [openSiteId, setOpenSiteId] = useState<string | null>(null);

  // Debounce search input — small list size, no need for tight typing.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [search]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from } = resolveRange(range);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      params.set("limit", "100");
      const res = await fetch(`/api/admin/medjobs/completed-work?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void refetch();
  }, [refetch]);
  useMedJobsRefresh(refetch);

  // Chart metric: default = activity (all touchpoints). When the user
  // picks ≥1 metric in the multi-series picker, switch to the custom
  // breakdown view that the /stats endpoint serves.
  const statsPath = useMemo(() => {
    if (chartSeries.size === 0) {
      return "/api/admin/student-outreach/stats?metric=activity";
    }
    const series = Array.from(chartSeries).join(",");
    return `/api/admin/student-outreach/stats?metric=custom&series=${encodeURIComponent(series)}`;
  }, [chartSeries]);

  const kpiSuffix =
    chartSeries.size === 0
      ? "logged events"
      : chartSeries.size === 1
        ? `${labelFor(Array.from(chartSeries)[0])} events`
        : `events (${chartSeries.size} metrics)`;

  const filteredRows = useMemo(() => {
    const typeSet = TYPE_FILTERS.find((f) => f.key === typeFilter)?.types;
    return rows.filter((r) => {
      if (typeSet && typeSet.size > 0 && !typeSet.has(r.touchpoint_type)) {
        return false;
      }
      // v9.0 Phase 7 Commit P: source filter narrows by entity type.
      // Stakeholder rows have source_kind="stakeholder" (or undefined
      // for legacy touchpoints); entity-task completions carry their
      // own source_kind.
      if (sourceFilter !== "all") {
        const rowSource = r.source_kind ?? "stakeholder";
        if (rowSource !== sourceFilter) return false;
      }
      if (debouncedSearch) {
        const hay = (r.organization_name || "").toLowerCase();
        if (!hay.includes(debouncedSearch)) return false;
      }
      return true;
    });
  }, [rows, typeFilter, sourceFilter, debouncedSearch]);

  return (
    <div>
      <PulseHeader
        title="MedJobs · Logs"
        kpiSuffix={kpiSuffix}
        statsPath={statsPath}
        range={range}
        onRangeChange={setRange}
      />

      {/* Multi-series picker. Compose a custom chart by checking N
          metrics; clear to fall back to the single-metric default. */}
      <ChartSeriesPicker
        selected={chartSeries}
        onToggle={(metric) =>
          setChartSeries((prev) => {
            const next = new Set(prev);
            if (next.has(metric)) next.delete(metric);
            else next.add(metric);
            return next;
          })
        }
        onClear={() => setChartSeries(new Set())}
      />

      <p className="-mt-2 mb-3 text-sm text-gray-500">
        Every logged action across MedJobs. Click any row to open it for context.
      </p>

      {/* v9.0 Phase 7 Commit P: source filter — narrows the unified
          feed to one entity type. Auto-set from ?source= URL param
          when admin lands here from an entity page's "View past
          history" link. */}
      <div className="mb-3 flex flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white p-0.5">
        {SOURCE_FILTERS.map((f) => {
          const active = sourceFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setSourceFilter(f.key)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                active
                  ? "bg-gray-900 font-semibold text-white"
                  : "font-medium text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Filter / search bar. Search by organization name; type pills
          narrow to a single channel (calls / emails / meetings /
          replies / notes). All client-side over the already-paginated
          rows. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by organization name…"
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
        <div className="flex gap-1 rounded-md border border-gray-200 bg-white p-0.5">
          {TYPE_FILTERS.map((f) => {
            const active = typeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "bg-gray-900 font-semibold text-white"
                    : "font-medium text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* v9.0 Phase 7 Commit M: keep rows rendered during background
          refetches; "Loading…" only on first load. */}
      {loading && rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : filteredRows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          {rows.length === 0
            ? "Nothing completed in this range yet."
            : "No matches for the current filter."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredRows.map((r) => (
            <li key={r.id}>
              <CompletedTaskCard
                row={r}
                onOpenDrawer={() => {
                  // v9.0 Phase 7 Commit O: route to the right drawer
                  // mode by source_kind. Stakeholder is the default
                  // for legacy touchpoint rows that pre-date the
                  // unified feed.
                  switch (r.source_kind) {
                    case "client":
                      if (r.source_id) setOpenProviderId(r.source_id);
                      break;
                    case "candidate":
                      if (r.source_id) setOpenCandidateId(r.source_id);
                      break;
                    case "site":
                      if (r.source_id) setOpenSiteId(r.source_id);
                      break;
                    default:
                      setOpenOutreachId(r.outreach_id);
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          onClose={() => setOpenOutreachId(null)}
          onAction={() => {
            void refetch();
          }}
        />
      )}
      {openProviderId && (
        <Drawer
          providerId={openProviderId}
          onClose={() => {
            setOpenProviderId(null);
            void refetch();
          }}
        />
      )}
      {openCandidateId && (
        <Drawer
          candidateId={openCandidateId}
          onClose={() => {
            setOpenCandidateId(null);
            void refetch();
          }}
        />
      )}
      {openSiteId && (
        <Drawer
          siteId={openSiteId}
          onClose={() => {
            setOpenSiteId(null);
            void refetch();
          }}
        />
      )}
    </div>
  );
}

function labelFor(metric: string): string {
  const opt = CHART_SERIES_OPTIONS.find((o) => o.metric === metric);
  return opt?.label ?? metric;
}

function ChartSeriesPicker({
  selected,
  onToggle,
  onClear,
}: {
  selected: Set<string>;
  onToggle: (metric: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Compare metrics
        </span>
        {selected.size > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CHART_SERIES_OPTIONS.map((opt) => {
          const checked = selected.has(opt.metric);
          return (
            <button
              key={opt.metric}
              onClick={() => onToggle(opt.metric)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                checked
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: opt.color }}
                aria-hidden
              />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
