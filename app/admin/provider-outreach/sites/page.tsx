"use client";

/**
 * Provider Outreach · Cities
 *
 * Type a state to see its cities. Each city card shows provider count,
 * outreach stats, and links into the worklist.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProviderOutreachRefresh, refreshProviderOutreach } from "@/hooks/useProviderOutreachRefresh";

const LOADED_STATES_KEY = "provider-outreach-loaded-states";
const LOADED_DATES_KEY = "provider-outreach-loaded-dates";
const CITY_AGENTS_KEY = "provider-outreach-city-agents";

const AGENTS = ["Chantel Wright", "Graize"];

function getCityAgents(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CITY_AGENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCityAgent(cityKey: string, agent: string | null) {
  try {
    const all = getCityAgents();
    if (agent) {
      all[cityKey] = agent;
    } else {
      delete all[cityKey];
    }
    localStorage.setItem(CITY_AGENTS_KEY, JSON.stringify(all));
  } catch {}
}

interface CityRow {
  city: string;
  state: string;
  total: number;
  has_email: number;
  in_sequence: number;
  claimed: number;
}

interface SiteRow {
  state: string;
  name: string;
  total: number;
  has_email: number;
  needs_email: number;
  not_contacted: number;
  in_sequence: number;
  claimed: number;
  needs_human: number;
}

const US_STATES: { abbr: string; name: string }[] = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DC", name: "District of Columbia" },
  { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" }, { abbr: "IL", name: "Illinois" },
  { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MD", name: "Maryland" }, { abbr: "ME", name: "Maine" }, { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" }, { abbr: "MO", name: "Missouri" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MT", name: "Montana" }, { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" },
  { abbr: "NE", name: "Nebraska" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NV", name: "Nevada" }, { abbr: "NY", name: "New York" },
  { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" }, { abbr: "OR", name: "Oregon" },
  { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" }, { abbr: "TX", name: "Texas" },
  { abbr: "UT", name: "Utah" }, { abbr: "VA", name: "Virginia" }, { abbr: "VT", name: "Vermont" },
  { abbr: "WA", name: "Washington" }, { abbr: "WI", name: "Wisconsin" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WY", name: "Wyoming" },
];

const STATE_MAP = Object.fromEntries(US_STATES.map((s) => [s.abbr, s.name]));

function getLoadedStates(): string[] {
  try {
    const raw = localStorage.getItem(LOADED_STATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLoadedStates(states: string[]) {
  try { localStorage.setItem(LOADED_STATES_KEY, JSON.stringify(states)); } catch {}
}

function getLoadedDates(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOADED_DATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLoadedDate(state: string) {
  try {
    const dates = getLoadedDates();
    dates[state] = new Date().toISOString();
    localStorage.setItem(LOADED_DATES_KEY, JSON.stringify(dates));
  } catch {}
}

// City data cache - fetched from API per state
const cityCache: Record<string, CityRow[]> = {};

export default function ProviderOutreachSitesPage() {
  const router = useRouter();
  const [loadedStates, setLoadedStates] = useState<string[]>([]);
  const [stateRows, setStateRows] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // City filtering
  const [activeState, setActiveState] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [cityRows, setCityRows] = useState<CityRow[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityAgents, setCityAgents] = useState<Record<string, string>>({});

  // Fetch cities when activeState changes
  useEffect(() => {
    if (!activeState) { setCityRows([]); return; }
    if (cityCache[activeState]) { setCityRows(cityCache[activeState]); return; }
    setLoadingCities(true);
    fetch(`/api/admin/provider-outreach/sites?cities_for=${activeState}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const rows = (d?.cities ?? []) as CityRow[];
        cityCache[activeState] = rows;
        setCityRows(rows);
      })
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  }, [activeState]);

  // Home view state
  const [homeSearch, setHomeSearch] = useState("");
  const [sortBy, setSortBy] = useState<"least" | "most" | "alpha">("least");
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setLoadedStates(getLoadedStates());
    setCityAgents(getCityAgents());
    setMounted(true);
  }, []);

  const refetch = useCallback(async (states: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const params = states.length > 0 ? `?loaded=${states.join(",")}` : "";
      const res = await fetch(`/api/admin/provider-outreach/sites${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setStateRows((data.rows ?? []) as SiteRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refetch(loadedStates);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, loadedStates, refetch]);
  useProviderOutreachRefresh(() => refetch(loadedStates));

  const activeSet = new Set(stateRows.map((r) => r.state));
  const availableStates = US_STATES.filter((s) => !activeSet.has(s.abbr));

  async function handleLoadState() {
    if (!selectedState) return;
    setLoadingState(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/load-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: selectedState }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error || "Failed to load state", type: "error" });
      } else {
        setToast({ message: data.message, type: "success" });
        const updated = [...getLoadedStates(), selectedState];
        const unique = [...new Set(updated)];
        saveLoadedStates(unique);
        saveLoadedDate(selectedState);
        setLoadedStates(unique);
        setActiveState(selectedState);
        setShowAdd(false);
        setSelectedState("");
        setStateSearch("");
        refreshProviderOutreach();
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setLoadingState(false);
    }
  }

  useEffect(() => {
    if (!showAdd) return;
    fetch("/api/admin/provider-outreach/state-counts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStateCounts(d?.counts ?? {}))
      .catch(() => {});
  }, [showAdd]);

  async function handleRemoveState(abbr: string) {
    if (!confirm(`Remove ${STATE_MAP[abbr] || abbr} from the pipeline?`)) return;
    // Try to delete from DB (may not exist yet)
    try {
      await fetch("/api/admin/provider-outreach/load-state", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: abbr }),
      });
    } catch {}
    // Always remove from localStorage
    const updated = getLoadedStates().filter((s) => s !== abbr);
    saveLoadedStates(updated);
    setLoadedStates(updated);
    if (activeState === abbr) setActiveState(null);
    setToast({ message: `Removed ${STATE_MAP[abbr] || abbr}`, type: "success" });
    refreshProviderOutreach();
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Get cities for the active state
  const cities = cityRows;
  const filteredCities = citySearch
    ? cities.filter((c) => c.city.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  // Sort cities by total providers (largest first)
  const sortedCities = [...filteredCities].sort((a, b) => b.total - a.total);

  // Aggregate stats for active state
  const activeStateRow = stateRows.find((r) => r.state === activeState);
  const totalProviders = activeStateRow?.total || cities.reduce((s, c) => s + c.total, 0);
  const totalInSequence = activeStateRow?.in_sequence || cities.reduce((s, c) => s + c.in_sequence, 0);
  const totalClaimed = activeStateRow?.claimed || cities.reduce((s, c) => s + c.claimed, 0);

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-primary-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Loading / empty */}
      {loading && stateRows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading...</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : loadedStates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
          <p className="text-sm font-medium text-gray-700">No states loaded yet.</p>
          <p className="mt-1 text-xs text-gray-500">
            Click <strong>+ Add State</strong> to load a state into the pipeline.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            + Add State
          </button>
        </div>
      ) : !activeState ? (
        /* ── Home dashboard ── */
        (() => {
          const totalProv = stateRows.reduce((s, r) => s + r.total, 0);
          const totalCalled = stateRows.reduce((s, r) => s + r.in_sequence, 0);
          const totalClaimed_ = stateRows.reduce((s, r) => s + r.claimed, 0) || 0;
          const leftToCall = totalProv - totalCalled;
          const loadedDates = getLoadedDates();

          // Build state data for table
          const stateData = loadedStates.map((abbr) => {
            const row = stateRows.find((r) => r.state === abbr);
            const providerCount = row?.total || 0;
            const called = row?.in_sequence || 0;
            const claimed = row?.claimed || 0;
            const progress = providerCount > 0 ? Math.round((called / providerCount) * 100) : 0;
            const lastWorked = loadedDates[abbr] || null;
            const completed = progress >= 100;
            return { abbr, providerCount, called, claimed, progress, lastWorked, completed };
          });

          const activeStates = stateData.filter((s) => !s.completed);
          const completedStates = stateData.filter((s) => s.completed);

          // Filter by search
          const searchFiltered = homeSearch
            ? activeStates.filter((s) => (STATE_MAP[s.abbr] || s.abbr).toLowerCase().includes(homeSearch.toLowerCase()) || s.abbr.toLowerCase().includes(homeSearch.toLowerCase()))
            : activeStates;

          // Sort
          const sorted = [...searchFiltered].sort((a, b) => {
            if (sortBy === "least") return a.progress - b.progress;
            if (sortBy === "most") return b.progress - a.progress;
            return (STATE_MAP[a.abbr] || a.abbr).localeCompare(STATE_MAP[b.abbr] || b.abbr);
          });

          // "Pick up where you left off" - most recently worked states (up to 3)
          const recentStates = [...activeStates]
            .filter((s) => s.lastWorked)
            .sort((a, b) => new Date(b.lastWorked!).getTime() - new Date(a.lastWorked!).getTime())
            .slice(0, 3);

          function timeAgoShort(dateStr: string): string {
            const diff = Date.now() - new Date(dateStr).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            return `${days}d ago`;
          }

          return (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Provider Outreach</h1>
                  <p className="text-sm text-gray-500 mt-0.5">{totalProv.toLocaleString()} providers across {loadedStates.length} open {loadedStates.length === 1 ? "state" : "states"}</p>
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  + Add State
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {([
                  { label: "Total providers", value: totalProv.toLocaleString(), color: "text-gray-900", filter: "all" },
                  { label: "Called", value: totalCalled.toLocaleString(), color: "text-blue-600", filter: "called" },
                  { label: "Claimed", value: totalClaimed_.toLocaleString(), color: "text-emerald-600", filter: "claimed" },
                  { label: "Left to call", value: leftToCall.toLocaleString(), color: "text-amber-600", filter: "left_to_call" },
                ]).map((stat) => (
                  <button
                    key={stat.label}
                    onClick={() => router.push(`/admin/provider-outreach/sites/providers?filter=${stat.filter}`)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-left hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-8">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Jump to a state..."
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                />
              </div>

              {/* Pick up where you left off */}
              {recentStates.length > 0 && !homeSearch && (
                <div className="mb-8">
                  <h2 className="text-sm font-medium text-gray-500 mb-3">Pick up where you left off</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {recentStates.map((s) => (
                      <button
                        key={s.abbr}
                        onClick={() => { setActiveState(s.abbr); setCitySearch(""); }}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-left hover:border-gray-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold text-gray-900">{STATE_MAP[s.abbr] || s.abbr}</h3>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-gray-400 transition-colors">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${Math.min(s.progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs tabular-nums text-gray-500">{s.progress}% called</span>
                          <span className="text-xs text-gray-400">you, {timeAgoShort(s.lastWorked!)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All states table */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-gray-500">All states</h2>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "least" | "most" | "alpha")}
                    className="text-xs text-gray-500 bg-transparent border-none outline-none cursor-pointer pr-4"
                  >
                    <option value="least">Sort: Least done</option>
                    <option value="most">Sort: Most done</option>
                    <option value="alpha">Sort: A-Z</option>
                  </select>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_80px_minmax(120px,1fr)_70px_70px_90px_32px] gap-3 px-5 py-2.5 border-b border-gray-100 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    <span>State</span>
                    <span className="text-right">Providers</span>
                    <span>Progress</span>
                    <span className="text-right">Called</span>
                    <span className="text-right">Claimed</span>
                    <span className="text-right">Last worked</span>
                    <span />
                  </div>

                  {sorted.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">No states match your search.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {sorted.map((s) => (
                        <div
                          key={s.abbr}
                          className="w-full grid grid-cols-[1fr_80px_minmax(120px,1fr)_70px_70px_90px_32px] gap-3 items-center px-5 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                          onClick={() => { setActiveState(s.abbr); setCitySearch(""); }}
                        >
                          <span className="text-sm font-semibold text-gray-900">{STATE_MAP[s.abbr] || s.abbr}</span>
                          <span className="text-sm tabular-nums text-gray-600 text-right">{s.providerCount.toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${Math.min(s.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-gray-400 w-8 text-right">{s.progress}%</span>
                          </div>
                          <span className="text-sm tabular-nums text-gray-600 text-right">{s.called.toLocaleString()}</span>
                          <span className="text-sm tabular-nums text-gray-600 text-right">{s.claimed.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 text-right">{s.lastWorked ? timeAgoShort(s.lastWorked) : "--"}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveState(s.abbr); }}
                            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            title={`Remove ${STATE_MAP[s.abbr] || s.abbr}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Completed states */}
              <div>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showCompleted ? "rotate-90" : ""}`}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Completed states {completedStates.length}
                </button>
                {showCompleted && completedStates.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {completedStates.map((s) => (
                        <button
                          key={s.abbr}
                          onClick={() => { setActiveState(s.abbr); setCitySearch(""); }}
                          className="w-full grid grid-cols-[1fr_80px_minmax(120px,1fr)_70px_70px_90px] gap-3 items-center px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">{STATE_MAP[s.abbr] || s.abbr}</span>
                          </div>
                          <span className="text-sm tabular-nums text-gray-600 text-right">{s.providerCount.toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                              <div className="h-full bg-emerald-500 rounded-full w-full" />
                            </div>
                            <span className="text-xs tabular-nums text-emerald-600 w-8 text-right">100%</span>
                          </div>
                          <span className="text-sm tabular-nums text-gray-600 text-right">{s.called.toLocaleString()}</span>
                          <span className="text-sm tabular-nums text-gray-600 text-right">{s.claimed.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 text-right">{s.lastWorked ? timeAgoShort(s.lastWorked) : "--"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {showCompleted && completedStates.length === 0 && (
                  <p className="text-xs text-gray-400 pl-5">No completed states yet.</p>
                )}
              </div>
            </div>
          );
        })()
      ) : (
        <div>
          {/* State dropdown + back */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveState(null)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <select
              value={activeState}
              onChange={(e) => { setActiveState(e.target.value || null); setCitySearch(""); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
            >
              {loadedStates.map((abbr) => (
                <option key={abbr} value={abbr}>
                  {STATE_MAP[abbr] || abbr} ({abbr})
                </option>
              ))}
            </select>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              + Add State
            </button>
          </div>

          {/* State summary header */}
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {STATE_MAP[activeState] || activeState}
                </h2>
                <p className="text-sm text-gray-500">
                  {totalProviders.toLocaleString()} providers across {cities.length} cities
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold tabular-nums text-gray-900">{totalInSequence.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400">In sequence</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold tabular-nums text-gray-900">{totalClaimed.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400">Claimed</p>
                </div>
              </div>
            </div>
          </div>

          {/* City search */}
          <div className="relative mb-5">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search cities in ${STATE_MAP[activeState] || activeState}...`}
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* City list */}
          {loadingCities ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">Loading cities...</p>
            </div>
          ) : sortedCities.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">
                {citySearch ? "No cities match your search." : "No cities found for this state."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_80px_130px_90px] gap-2 px-5 py-2.5 border-b border-gray-100 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                <span>City</span>
                <span className="text-right">Providers</span>
                <span className="text-right">Contacted</span>
                <span>Agent</span>
                <span className="text-right">Status</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-100">
                {sortedCities.map((city) => {
                  const contacted = city.in_sequence + city.claimed;

                  let statusLabel = "Not started";
                  let statusColor = "text-gray-400";
                  if (contacted > 0) {
                    statusLabel = "In progress";
                    statusColor = "text-blue-600";
                  }
                  if (city.total > 0 && contacted / city.total >= 0.8) {
                    statusLabel = "Nearly done";
                    statusColor = "text-emerald-600";
                  }

                  const cityKey = `${city.state}:${city.city}`;
                  const assignedAgent = cityAgents[cityKey] || "";

                  return (
                    <div
                      key={city.city}
                      className="grid grid-cols-[1fr_80px_80px_130px_90px] gap-2 items-center px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <Link
                        href={`/admin/provider-outreach/sites/worklist?state=${city.state}&city=${encodeURIComponent(city.city)}`}
                        className="text-sm font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors"
                      >
                        {city.city}
                      </Link>
                      <span className="text-sm tabular-nums text-gray-600 text-right">{city.total.toLocaleString()}</span>
                      <span className="text-sm tabular-nums text-gray-600 text-right">{contacted}</span>
                      <select
                        value={assignedAgent}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          saveCityAgent(cityKey, val);
                          setCityAgents((prev) => {
                            const next = { ...prev };
                            if (val) next[cityKey] = val;
                            else delete next[cityKey];
                            return next;
                          });
                        }}
                        className={`text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer ${
                          assignedAgent ? "text-gray-900 font-medium" : "text-gray-400"
                        }`}
                      >
                        <option value="">Unassigned</option>
                        {AGENTS.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <span className={`text-xs font-medium text-right ${statusColor}`}>{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add State Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Load State into Pipeline</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select a state to load all its active providers into the outreach pipeline.
            </p>
            <div className="relative">
              <input
                type="text"
                value={stateSearch}
                onChange={(e) => {
                  setStateSearch(e.target.value);
                  setSelectedState("");
                }}
                placeholder="Search for a state..."
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              {stateSearch && !selectedState && (
                <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {availableStates
                    .filter((s) =>
                      s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                      s.abbr.toLowerCase().includes(stateSearch.toLowerCase())
                    )
                    .map((s) => (
                      <li key={s.abbr}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedState(s.abbr);
                            setStateSearch(s.name);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{s.name} <span className="text-gray-400">({s.abbr})</span></span>
                          {stateCounts[s.abbr] != null && (
                            <span className="text-xs text-gray-400 tabular-nums">{stateCounts[s.abbr].toLocaleString()} providers</span>
                          )}
                        </button>
                      </li>
                    ))}
                  {availableStates.filter((s) =>
                    s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                    s.abbr.toLowerCase().includes(stateSearch.toLowerCase())
                  ).length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-400">No matching states</li>
                  )}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAdd(false); setSelectedState(""); setStateSearch(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadState}
                disabled={!selectedState || loadingState}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loadingState ? "Loading..." : "Load State"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
