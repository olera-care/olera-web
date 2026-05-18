"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FamilyMetadata } from "@/lib/types";

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Exploring",
};

type FilterTab = "all" | "guest" | "claimed" | "public";

interface SeekerRow {
  id: string;
  slug: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  care_types: string[];
  metadata: FamilyMetadata;
  account_id: string | null;
  claim_state: string;
  source: string;
  created_at: string;
}

interface TabCounts {
  total: number;
  guest: number;
  claimed: number;
  public: number;
  thisWeek: number;
}

const PAGE_SIZE = 25;

export default function AdminCareSeekersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params (deep-linking from Demand page)
  const initialFilter = (searchParams.get("filter") as FilterTab) || "all";
  const initialCity = searchParams.get("city") || "";
  const initialState = searchParams.get("state") || "";

  const [seekers, setSeekers] = useState<SeekerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>(initialFilter);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [stateFilter, setStateFilter] = useState(initialState);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Tab counts from API
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);

  // Distinct cities for dropdown
  const [cities, setCities] = useState<{ city: string; state: string; count: number }[]>([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showToast(message: string, type: "success" | "error" = "success") {
    clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  // Debounced search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter, cityFilter, stateFilter]);

  const fetchSeekers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(PAGE_SIZE));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filter === "guest") params.set("guest_only", "true");
      if (filter === "claimed") params.set("claimed_only", "true");
      if (filter === "public") params.set("public_only", "true");
      if (cityFilter) params.set("city", cityFilter);
      if (stateFilter) params.set("state", stateFilter);

      const res = await fetch(`/api/admin/care-seekers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSeekers(data.seekers ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch care seekers:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, cityFilter, stateFilter, page]);

  // Load tab counts + distinct cities on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch tab counts from dedicated endpoint
        const statsRes = await fetch("/api/admin/care-seekers/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setTabCounts({
            total: statsData.total ?? 0,
            guest: statsData.guest ?? 0,
            claimed: statsData.claimed ?? 0,
            public: statsData.public ?? 0,
            thisWeek: statsData.thisWeek ?? 0,
          });
        }

        // Fetch distinct cities from dedicated endpoint
        const citiesRes = await fetch("/api/admin/care-seekers/cities");
        if (citiesRes.ok) {
          const data = await citiesRes.json();
          setCities(data.cities ?? []);
        }
      } catch { /* ignore */ }
    }
    loadInitialData();
  }, []);

  // Refresh tab counts after delete
  const refreshTabCounts = useCallback(async () => {
    try {
      const statsRes = await fetch("/api/admin/care-seekers/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTabCounts({
          total: statsData.total ?? 0,
          guest: statsData.guest ?? 0,
          claimed: statsData.claimed ?? 0,
          public: statsData.public ?? 0,
          thisWeek: statsData.thisWeek ?? 0,
        });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchSeekers();
  }, [fetchSeekers]);

  // Close city dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
        setCitySearch("");
      }
    }
    if (cityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [cityDropdownOpen]);

  // Filtered cities based on search
  const filteredCities = citySearch
    ? cities.filter(c =>
        c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
        c.state.toLowerCase().includes(citySearch.toLowerCase())
      )
    : cities;

  const selectedCityLabel = cityFilter
    ? `${cityFilter}${stateFilter ? `, ${stateFilter}` : ""}`
    : "All cities";

  async function handleDelete(seeker: SeekerRow) {
    if (!confirm(`Delete "${seeker.display_name}"? This will also delete all their connections. This cannot be undone.`)) return;

    // Optimistic removal
    setSeekers((prev) => prev.filter((s) => s.id !== seeker.id));
    setTotal((prev) => prev - 1);

    try {
      const res = await fetch(`/api/admin/care-seekers/${seeker.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Deleted ${seeker.display_name}`);
        refreshTabCounts(); // Refresh all tab counts
      } else {
        // Revert
        setSeekers((prev) => [...prev, seeker].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        setTotal((prev) => prev + 1);
        showToast("Failed to delete care seeker", "error");
      }
    } catch {
      setSeekers((prev) => [...prev, seeker].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setTotal((prev) => prev + 1);
      showToast("Network error", "error");
    }
  }

  function clearFilters() {
    setCityFilter("");
    setStateFilter("");
    setFilter("all");
    // Clear URL params
    router.replace("/admin/care-seekers");
  }

  const hasActiveFilters = cityFilter || stateFilter || filter !== "all";

  const tabs: { label: string; value: FilterTab; count: number | null }[] = [
    { label: "All", value: "all", count: tabCounts?.total ?? null },
    { label: "Guest", value: "guest", count: tabCounts?.guest ?? null },
    { label: "Claimed", value: "claimed", count: tabCounts?.claimed ?? null },
    { label: "Public", value: "public", count: tabCounts?.public ?? null },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Care Seekers</h1>
        <p className="text-sm text-gray-500 mt-1">Families and individuals looking for care</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Seekers</p>
          <p className="text-2xl font-bold text-gray-900">{tabCounts ? tabCounts.total : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Public Profiles</p>
          <p className="text-2xl font-bold text-primary-600">{tabCounts ? tabCounts.public : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Guests (unclaimed)</p>
          <p className="text-2xl font-bold text-amber-600">{tabCounts ? tabCounts.guest : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">New This Week</p>
          <p className="text-2xl font-bold text-emerald-600">{tabCounts ? tabCounts.thisWeek : "—"}</p>
        </div>
      </div>

      {/* Filter tabs + city filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={[
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === tab.value
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={[
                  "ml-1.5 px-1.5 py-0.5 rounded text-xs",
                  filter === tab.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-500",
                ].join(" ")}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* City dropdown */}
        {cities.length > 0 && (
          <div ref={cityDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className={[
                "flex items-center justify-between gap-2 min-w-[160px] px-3.5 py-2",
                "bg-white border rounded-lg text-sm font-medium transition-all",
                cityFilter
                  ? "border-primary-400 text-gray-900"
                  : "border-gray-300 text-gray-600 hover:border-gray-400",
                cityDropdownOpen ? "ring-2 ring-primary-100 border-primary-400" : "",
              ].join(" ")}
            >
              <span className="truncate">{selectedCityLabel}</span>
              <svg
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {cityDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                {/* Search input */}
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search cities..."
                    autoFocus
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 placeholder:text-gray-400"
                  />
                </div>

                {/* Options list */}
                <div className="max-h-64 overflow-y-auto">
                  {/* All cities option */}
                  <button
                    type="button"
                    onClick={() => {
                      setCityFilter("");
                      setStateFilter("");
                      setCityDropdownOpen(false);
                      setCitySearch("");
                    }}
                    className={[
                      "w-full px-3 py-2.5 text-left text-sm transition-colors",
                      !cityFilter
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    All cities
                  </button>

                  {filteredCities.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-gray-400 text-center">
                      No cities found
                    </div>
                  ) : (
                    filteredCities.map((c) => (
                      <button
                        key={`${c.city}-${c.state}`}
                        type="button"
                        onClick={() => {
                          setCityFilter(c.city);
                          setStateFilter(c.state);
                          setCityDropdownOpen(false);
                          setCitySearch("");
                        }}
                        className={[
                          "w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center justify-between",
                          cityFilter === c.city && stateFilter === c.state
                            ? "bg-primary-50 text-primary-700 font-medium"
                            : "text-gray-900 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <span>
                          {c.city}{c.state ? `, ${c.state}` : ""}
                        </span>
                        <span className="text-xs text-gray-400">{c.count}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : seekers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No care seekers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">City</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Care Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Timeline</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {seekers.map((seeker) => {
                  const meta = seeker.metadata || {};
                  const isGuest = !seeker.account_id;
                  const isPublic = meta.care_post?.status === "active";
                  return (
                    <tr
                      key={seeker.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/care-seekers/${seeker.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {seeker.display_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]">{seeker.email || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{seeker.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {seeker.city ? (
                          <span>{seeker.city}{seeker.state ? `, ${seeker.state}` : ""}</span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {seeker.care_types.length > 0 ? (
                          <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                            {seeker.care_types[0]}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {meta.timeline ? TIMELINE_LABELS[meta.timeline] || meta.timeline : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isPublic && (
                            <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                              Public
                            </span>
                          )}
                          {isGuest ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                              Guest
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              Claimed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(seeker.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(seeker);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && seekers.length > 0 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500">
            {total <= PAGE_SIZE
              ? `${total} total`
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
            }
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
