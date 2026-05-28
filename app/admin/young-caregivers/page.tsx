"use client";

import { useEffect, useState } from "react";

interface Funnel {
  page_views: number;
  scroll_25: number;
  scroll_50: number;
  scroll_75: number;
  scroll_100: number;
  discord_clicks: number;
}

interface Stats {
  days: number;
  funnel: Funnel;
  sections: Record<string, number>;
  time_on_page: {
    avg_seconds: number;
    median_seconds: number;
    sample_size: number;
  };
  daily: {
    views: Record<string, number>;
    clicks: Record<string, number>;
  };
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About",
  "join-cta": "Join CTA",
  "explore-care": "Explore Care",
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function FunnelBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-28 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-500"
          style={{
            width: `${Math.max(pct, 2)}%`,
            backgroundColor: pct > 0 ? "#5b80ae" : "#e5e7eb",
          }}
        />
        <span className="absolute inset-0 flex items-center px-3 text-sm font-medium" style={{ color: pct > 40 ? "#fff" : "#374151" }}>
          {count} {max > 0 && <span className="text-xs ml-1 opacity-60">({pct}%)</span>}
        </span>
      </div>
    </div>
  );
}

export default function YoungCaregiversAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/young-caregivers/stats?days=${days}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [days]);

  const sortedDays = stats
    ? [
        ...new Set([
          ...Object.keys(stats.daily.views),
          ...Object.keys(stats.daily.clicks),
        ]),
      ].sort((a, b) => b.localeCompare(a))
    : [];

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold mb-1">Young Caregivers</h1>
      <p className="text-sm text-gray-500 mb-6">
        Page engagement funnel &middot; Discord join tracking
      </p>

      {/* Date range picker */}
      <div className="flex gap-2 mb-8">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              days === d
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : stats ? (
        <div className="space-y-8">
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">Page Views</p>
              <p className="text-3xl font-bold">{stats.funnel.page_views}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">Discord Clicks</p>
              <p className="text-3xl font-bold">{stats.funnel.discord_clicks}</p>
            </div>
          </div>

          {/* Daily breakdown */}
          {sortedDays.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Daily Breakdown</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Views</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Clicks</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDays.map((date) => {
                    const views = stats.daily.views[date] || 0;
                    const clicks = stats.daily.clicks[date] || 0;
                    const rate = views > 0 ? `${Math.round((clicks / views) * 100)}%` : "—";
                    return (
                      <tr key={date} className="border-b border-gray-50">
                        <td className="px-6 py-2.5 text-gray-700">{date}</td>
                        <td className="px-6 py-2.5 text-right">{views}</td>
                        <td className="px-6 py-2.5 text-right font-medium">{clicks}</td>
                        <td className="px-6 py-2.5 text-right text-gray-500">{rate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {sortedDays.length === 0 && stats.funnel.page_views === 0 && (
            <p className="text-sm text-gray-400">No data recorded yet. Events will appear once the page receives traffic.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-red-500">Failed to load stats.</p>
      )}
    </div>
  );
}
