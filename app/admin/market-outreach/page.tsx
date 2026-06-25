"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OutreachStatus = "to_contact" | "contacted" | "responded" | "referring" | "dismissed";
type QueueStage = "all" | "not_started" | "started" | "momentum" | "stale";

type QueueProvider = {
  key: string;
  provider_id: string | null;
  profile_id: string | null;
  directory_id: string;
  name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  claim_state: string | null;
  stage: Exclude<QueueStage, "all">;
  viewed_at: string | null;
  last_action_at: string | null;
  total_targets: number;
  worked_targets: number;
  status_counts: Record<OutreachStatus, number>;
  recent_targets: Array<{
    id: string;
    name: string;
    status: OutreachStatus;
    updated_at: string;
  }>;
};

type QueueResponse = {
  providers: QueueProvider[];
  totals: {
    viewed: number;
    not_started: number;
    started: number;
    momentum: number;
    stale: number;
    worked: number;
    referring: number;
  };
};

const STAGE_LABELS: Record<Exclude<QueueStage, "all">, string> = {
  not_started: "Viewed, not started",
  started: "Started",
  momentum: "Responded/referring",
  stale: "Needs nudge",
};

const STAGE_CLASSES: Record<Exclude<QueueStage, "all">, string> = {
  not_started: "bg-amber-50 text-amber-700 border-amber-100",
  started: "bg-blue-50 text-blue-700 border-blue-100",
  momentum: "bg-emerald-50 text-emerald-700 border-emerald-100",
  stale: "bg-rose-50 text-rose-700 border-rose-100",
};

const STATUS_LABELS: Record<OutreachStatus, string> = {
  to_contact: "To contact",
  contacted: "Contacted",
  responded: "Responded",
  referring: "Referring",
  dismissed: "Dismissed",
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ label, value, tone = "gray" }: { label: string; value: number | string; tone?: "gray" | "amber" | "blue" | "emerald" | "rose" }) {
  const toneClass = {
    gray: "text-gray-900",
    amber: "text-amber-700",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
    rose: "text-rose-700",
  }[tone];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StagePill({ stage }: { stage: Exclude<QueueStage, "all"> }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STAGE_CLASSES[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

function StatusCounts({ counts }: { counts: Record<OutreachStatus, number> }) {
  const statuses: OutreachStatus[] = ["contacted", "responded", "referring", "to_contact", "dismissed"];
  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((status) => {
        const count = counts[status] ?? 0;
        if (count === 0) return null;
        return (
          <span key={status} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {STATUS_LABELS[status]} {count}
          </span>
        );
      })}
    </div>
  );
}

export default function AdminMarketOutreachPage() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<QueueStage>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (provider: QueueProvider) => {
    const profileId = provider.profile_id ?? provider.key;
    if (!confirm(`Remove all outreach data for "${provider.name}"?\n\nThis will delete their outreach records and market view history.`)) {
      return;
    }

    setDeleting(profileId);
    try {
      const res = await fetch("/api/admin/market-outreach", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete");
      }
      // Remove from local state and recalculate totals
      setData((prev) => {
        if (!prev) return prev;
        const providers = prev.providers.filter((p) => p.key !== provider.key);
        return {
          ...prev,
          providers,
          totals: {
            viewed: providers.filter((p) => !!p.viewed_at).length,
            not_started: providers.filter((p) => p.stage === "not_started").length,
            started: providers.filter((p) => p.stage === "started").length,
            momentum: providers.filter((p) => p.stage === "momentum").length,
            stale: providers.filter((p) => p.stage === "stale").length,
            worked: providers.filter((p) => p.worked_targets > 0).length,
            referring: providers.filter((p) => p.status_counts.referring > 0).length,
          },
        };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/market-outreach");
        if (!res.ok) throw new Error("Failed to load market outreach queue");
        const json = (await res.json()) as QueueResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Failed to load market outreach queue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let rows = data?.providers ?? [];
    if (stage !== "all") rows = rows.filter((provider) => provider.stage === stage);

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((provider) => {
        const haystack = [
          provider.name,
          provider.email,
          provider.city,
          provider.state,
          provider.category,
          provider.provider_id,
          provider.profile_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return rows;
  }, [data?.providers, search, stage]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Market Outreach Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Providers who saw Growth, worked referral targets, or need an operator nudge.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Viewed growth" value={loading ? "-" : data?.totals.viewed ?? 0} />
        <StatCard label="Not started" value={loading ? "-" : data?.totals.not_started ?? 0} tone="amber" />
        <StatCard label="Started" value={loading ? "-" : data?.totals.started ?? 0} tone="blue" />
        <StatCard label="Responded/referring" value={loading ? "-" : data?.totals.momentum ?? 0} tone="emerald" />
        <StatCard label="Needs nudge" value={loading ? "-" : data?.totals.stale ?? 0} tone="rose" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit rounded-xl bg-gray-100 p-1 text-sm">
          {[
            ["all", "All"],
            ["stale", "Needs nudge"],
            ["not_started", "Not started"],
            ["started", "Started"],
            ["momentum", "Momentum"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStage(value as QueueStage)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                stage === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search providers..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 lg:max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {search || stage !== "all" ? "No providers match this queue filter" : "No growth outreach activity yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Provider</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Stage</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Target Work</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Latest Targets</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Last Touch</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((provider) => {
                  const activitySearch = provider.provider_id ?? provider.name;
                  const activityHref = `/admin/activity?actor=providers&view=feed&event_type=market_outreach_status_updated&search=${encodeURIComponent(activitySearch)}&days=90`;
                  const viewedHref = `/admin/activity?actor=providers&view=feed&event_type=market_diagnostic_viewed_no_leads&search=${encodeURIComponent(activitySearch)}&days=90`;

                  return (
                    <tr key={provider.key} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{provider.name}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {[provider.city, provider.state].filter(Boolean).join(", ") || "Location not set"}
                          {provider.email ? ` - ${provider.email}` : ""}
                        </div>
                        {provider.claim_state && (
                          <div className="mt-1 text-xs text-gray-400">{provider.claim_state}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StagePill stage={provider.stage} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="mb-2 font-medium text-gray-900">
                          {provider.worked_targets} / {provider.total_targets} worked
                        </div>
                        <StatusCounts counts={provider.status_counts} />
                      </td>
                      <td className="px-4 py-4">
                        {provider.recent_targets.length > 0 ? (
                          <div className="space-y-1.5">
                            {provider.recent_targets.map((target) => (
                              <div key={target.id} className="max-w-xs truncate text-xs text-gray-600" title={target.name}>
                                <span className="font-medium text-gray-800">{target.name}</span>
                                <span className="text-gray-400"> - {STATUS_LABELS[target.status]}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Viewed growth, no target work yet</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-xs text-gray-500">
                        <div>{formatDate(provider.last_action_at ?? provider.viewed_at)}</div>
                        <div className="mt-1 text-gray-400">
                          Viewed {formatDate(provider.viewed_at)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <Link href={`/admin/directory/${provider.directory_id}`} className="text-xs font-medium text-primary-700 hover:text-primary-800">
                            Profile
                          </Link>
                          <Link href={activityHref} className="text-xs font-medium text-gray-600 hover:text-gray-900">
                            Outreach activity
                          </Link>
                          <Link href={viewedHref} className="text-xs font-medium text-gray-600 hover:text-gray-900">
                            Growth views
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(provider)}
                            disabled={deleting === (provider.profile_id ?? provider.key)}
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {deleting === (provider.profile_id ?? provider.key) ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          Showing {filtered.length} of {data?.providers.length ?? 0} providers in the 90-day queue.
        </p>
      )}
    </div>
  );
}
