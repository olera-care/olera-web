"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateZScore } from "@/lib/experiments";

interface Variant {
  id: string;
  name: string;
  config: Record<string, unknown>;
  weight: number;
}

interface Experiment {
  id: string;
  name: string;
  status: string;
  created_at: string;
  variants: Variant[];
}

interface VariantStats {
  variantId: string;
  variantName: string;
  weight: number;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [stats, setStats] = useState<VariantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dateRange, setDateRange] = useState(14); // days
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch experiments with variants
      const { data: exps, error: expErr } = await supabase
        .from("experiments")
        .select("*")
        .order("created_at", { ascending: false });

      if (expErr) throw expErr;

      // Fetch variants for all experiments
      const expIds = (exps || []).map((e: Experiment) => e.id);
      const { data: variants, error: varErr } = await supabase
        .from("experiment_variants")
        .select("*")
        .in("experiment_id", expIds.length > 0 ? expIds : ["none"]);

      if (varErr) throw varErr;

      // Assemble experiments with variants
      const assembled = (exps || []).map((exp: Experiment) => ({
        ...exp,
        variants: (variants || []).filter((v: Variant & { experiment_id: string }) => v.experiment_id === exp.id),
      }));
      setExperiments(assembled);

      // Fetch stats for active/paused experiments
      const activeExp = assembled.find((e: Experiment) => e.status === "active" || e.status === "paused");
      if (activeExp && activeExp.variants.length > 0) {
        const variantIds = activeExp.variants.map((v: Variant) => v.id);
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - dateRange);
        const since = sinceDate.toISOString().split("T")[0];

        // Fetch impressions
        const { data: impressions } = await supabase
          .from("cta_impressions")
          .select("variant_id, count")
          .in("variant_id", variantIds)
          .gte("date", since);

        // Fetch conversions
        const { data: connections } = await supabase
          .from("connections")
          .select("experiment_variant_id")
          .in("experiment_variant_id", variantIds)
          .gte("created_at", sinceDate.toISOString());

        // Aggregate
        const variantStats: VariantStats[] = activeExp.variants.map((v: Variant) => {
          const totalImpressions = (impressions || [])
            .filter((i: { variant_id: string; count: number }) => i.variant_id === v.id)
            .reduce((sum: number, i: { count: number }) => sum + (i.count || 0), 0);
          const totalConversions = (connections || [])
            .filter((c: { experiment_variant_id: string }) => c.experiment_variant_id === v.id)
            .length;

          return {
            variantId: v.id,
            variantName: v.name,
            weight: v.weight,
            impressions: totalImpressions,
            conversions: totalConversions,
            conversionRate: totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0,
          };
        });

        setStats(variantStats);
      } else {
        setStats([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load experiments");
    } finally {
      setLoading(false);
    }
  }, [supabase, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleStatus(expId: string, currentStatus: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/experiments/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", experimentId: expId, currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to toggle status");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    }
    setSaving(false);
    fetchData();
  }

  async function updateWeight(variantId: string, weight: number) {
    try {
      const res = await fetch("/api/experiments/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_weight", variantId, weight }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to update weight");
      else fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update weight");
    }
  }

  // Statistical significance between first two variants
  const significance = stats.length >= 2
    ? calculateZScore(
        stats[0].conversions, stats[0].impressions,
        stats[1].conversions, stats[1].impressions
      )
    : null;

  const activeExperiment = experiments.find(e => e.status === "active" || e.status === "paused");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CTA Experiments</h1>
          <p className="text-sm text-gray-500 mt-1">A/B test provider page CTAs to optimize conversion</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading experiments...</div>
      ) : experiments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No experiments yet</p>
          <p className="text-sm text-gray-400">Run the migration script to create your first experiment:</p>
          <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
            scripts/migrate-experiments.sql
          </code>
        </div>
      ) : (
        <>
          {/* ── Active Experiment Dashboard ── */}
          {activeExperiment && stats.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-8">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">{activeExperiment.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activeExperiment.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {activeExperiment.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                  <button
                    onClick={() => toggleStatus(activeExperiment.id, activeExperiment.status)}
                    disabled={saving}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeExperiment.status === "active"
                        ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {activeExperiment.status === "active" ? "Pause" : "Activate"}
                  </button>
                </div>
              </div>

              {/* Stats Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="px-6 py-3 font-medium">Variant</th>
                      <th className="px-6 py-3 font-medium text-right">Weight</th>
                      <th className="px-6 py-3 font-medium text-right">Impressions</th>
                      <th className="px-6 py-3 font-medium text-right">Connections</th>
                      <th className="px-6 py-3 font-medium text-right">Conv. Rate</th>
                      <th className="px-6 py-3 font-medium text-right">vs Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s, i) => {
                      const isControl = i === 0;
                      const lift = !isControl && stats[0].conversionRate > 0
                        ? ((s.conversionRate - stats[0].conversionRate) / stats[0].conversionRate) * 100
                        : 0;

                      return (
                        <tr key={s.variantId} className="border-b border-gray-50 last:border-0">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{s.variantName}</span>
                              {isControl && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                  control
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <input
                              type="number"
                              value={s.weight}
                              onChange={(e) => updateWeight(s.variantId, Number(e.target.value))}
                              min={0}
                              max={100}
                              className="w-16 text-right text-sm border border-gray-200 rounded-lg px-2 py-1"
                            />
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700 tabular-nums">
                            {s.impressions.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700 tabular-nums">
                            {s.conversions}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">
                            {s.conversionRate.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isControl ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className={`font-medium ${lift > 0 ? "text-green-600" : lift < 0 ? "text-red-600" : "text-gray-400"}`}>
                                {lift > 0 ? "+" : ""}{lift.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Significance Banner */}
              {significance && (stats[0].impressions >= 100 || stats[1].impressions >= 100) && (
                <div className={`px-6 py-3 border-t text-sm ${
                  significance.significant
                    ? "bg-green-50 border-green-100 text-green-800"
                    : "bg-gray-50 border-gray-100 text-gray-600"
                }`}>
                  {significance.significant ? (
                    <>
                      <span className="font-semibold">Statistically significant</span> (p={significance.pValue.toFixed(4)}, z={significance.zScore.toFixed(2)}).
                      {" "}You can confidently pick the winner.
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Not yet significant</span> (p={significance.pValue.toFixed(4)}).
                      {" "}Need more data — keep running.
                      {stats[0].impressions + stats[1].impressions < 500 && (
                        <span className="text-gray-500"> (~{Math.ceil((500 - stats[0].impressions - stats[1].impressions) / 50)} more days at current traffic)</span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── All Experiments List ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">All Experiments</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {experiments.map((exp) => (
                <div key={exp.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{exp.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        exp.status === "active" ? "bg-green-100 text-green-700"
                          : exp.status === "paused" ? "bg-yellow-100 text-yellow-700"
                          : exp.status === "completed" ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(exp.status === "draft" || exp.status === "paused") && (
                        <button
                          onClick={() => toggleStatus(exp.id, exp.status)}
                          disabled={saving}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {exp.status === "active" && (
                        <button
                          onClick={() => toggleStatus(exp.id, exp.status)}
                          disabled={saving}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                        >
                          Pause
                        </button>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {exp.variants.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exp.variants.map((v) => (
                        <span key={v.id} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-lg">
                          {v.name} ({v.weight}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
