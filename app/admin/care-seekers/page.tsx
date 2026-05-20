"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FamilyMetadata, NudgeSequence } from "@/lib/types";
import DateRangePopover, { type DateRangeValue, resolveRange } from "@/components/admin/DateRangePopover";

type FilterTab = "all" | "published" | "unpublished" | "needs_nudge";

interface SeekerRow {
  id: string;
  slug: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  care_types: string[];
  metadata: FamilyMetadata;
  account_id: string | null;
  claim_state: string;
  source: string;
  created_at: string;
  connection_count: number;
  profile_complete: boolean;
  nudge_phase: "none" | "active" | "maintenance" | "done";
  current_sequence: NudgeSequence | null;
  sequence_type: "completion" | "publish";
}

interface TabCounts {
  total: number;
  published: number;
  unpublished: number;
  thisWeek: number;
  needsNudge: number;
}

// Helper to format relative time
function timeAgo(isoDate: string | undefined): string {
  if (!isoDate) return "Never";
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Format date as "Feb 02, 2026"
function formatJoinedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

// Calculate profile completeness (matches server-side calculateFamilyCompleteness)
function calculateCompleteness(seeker: SeekerRow): number {
  const meta = seeker.metadata || {};

  // Use cached value if available
  if (meta.profile_completeness !== undefined) {
    return meta.profile_completeness;
  }

  // Same weights as lib/admin/profile-completeness.ts
  const checks: Array<{ weight: number; check: () => boolean }> = [
    // Basic Info
    { weight: 15, check: () => !!seeker.image_url },
    { weight: 5, check: () => !!seeker.display_name },
    { weight: 5, check: () => !!seeker.city },
    // Contact
    { weight: 10, check: () => !!seeker.email },
    { weight: 10, check: () => !!seeker.phone },
    { weight: 5, check: () => !!meta.contact_preference },
    // Care Recipient
    { weight: 5, check: () => !!meta.relationship_to_recipient },
    { weight: 5, check: () => !!meta.age },
    { weight: 5, check: () => !!seeker.description },
    // Care Needs
    { weight: 5, check: () => (seeker.care_types?.length ?? 0) > 0 },
    { weight: 4, check: () => (meta.care_needs?.length ?? 0) > 0 },
    { weight: 3, check: () => !!meta.timeline },
    { weight: 3, check: () => !!meta.schedule_preference },
    // Payment
    { weight: 20, check: () => (meta.payment_methods?.length ?? 0) > 0 },
  ];

  let earned = 0;
  for (const { weight, check } of checks) {
    if (check()) earned += weight;
  }

  return Math.min(earned, 100);
}

// Helper to get nudge status display
function getNudgeStatus(seeker: SeekerRow): {
  label: string;
  sublabel: string;
  isSuccess: boolean;
} {
  const meta = seeker.metadata || {};
  const isPublished = meta.care_post?.status === "active";
  const isUnsubscribed = meta.nudges_unsubscribed === true;
  const seq = seeker.current_sequence;
  const nudgeCount = seq?.nudge_count || 0;
  const isMaintenancePhase = seq?.phase === "maintenance";

  // Published = success (green)
  if (isPublished) {
    return { label: "Published", sublabel: "Done", isSuccess: true };
  }

  // Opted out
  if (isUnsubscribed) {
    return { label: "Opted out", sublabel: "No emails", isSuccess: false };
  }

  // Determine which sequence they're in
  const sequenceType = seeker.sequence_type; // "completion" or "publish"
  const sequenceLabel = sequenceType === "completion" ? "Profile" : "Publish";

  if (isMaintenancePhase) {
    const lastNudge = seq?.last_nudge_at;
    return {
      label: `${sequenceLabel}: monthly`,
      sublabel: lastNudge ? timeAgo(lastNudge) : "Pending",
      isSuccess: false
    };
  }

  // Active sequence (0-4 nudges)
  const lastNudge = seq?.last_nudge_at;
  return {
    label: `${sequenceLabel}: ${nudgeCount}/4`,
    sublabel: nudgeCount === 0 ? "Pending" : (lastNudge ? timeAgo(lastNudge) : "—"),
    isSuccess: false
  };
}

const PAGE_SIZE = 25;

export default function AdminCareSeekersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: "all",
    customFrom: "",
    customTo: "",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);

  const [cities, setCities] = useState<{ city: string; state: string; count: number }[]>([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [pendingDelete, setPendingDelete] = useState<SeekerRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filter, cityFilter, stateFilter, dateRange]);

  const fetchSeekers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(PAGE_SIZE));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filter === "published") params.set("published_only", "true");
      if (filter === "unpublished") params.set("unpublished_only", "true");
      if (filter === "needs_nudge") params.set("needs_nudge", "true");
      if (cityFilter) params.set("city", cityFilter);
      if (stateFilter) params.set("state", stateFilter);

      // Date range filter
      const resolved = resolveRange(dateRange);
      if (resolved.from) params.set("from_date", resolved.from);
      if (resolved.to) params.set("to_date", resolved.to);

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
  }, [debouncedSearch, filter, cityFilter, stateFilter, dateRange, page]);

  const fetchTabCounts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      const resolved = resolveRange(dateRange);
      if (resolved.from) params.set("from_date", resolved.from);
      if (resolved.to) params.set("to_date", resolved.to);

      const statsRes = await fetch(`/api/admin/care-seekers/stats?${params}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTabCounts({
          total: statsData.total ?? 0,
          published: statsData.published ?? 0,
          unpublished: statsData.unpublished ?? 0,
          thisWeek: statsData.thisWeek ?? 0,
          needsNudge: statsData.needsNudge ?? 0,
        });
      }
    } catch { /* ignore */ }
  }, [dateRange]);

  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  useEffect(() => {
    async function loadCities() {
      try {
        const citiesRes = await fetch("/api/admin/care-seekers/cities");
        if (citiesRes.ok) {
          const data = await citiesRes.json();
          setCities(data.cities ?? []);
        }
      } catch { /* ignore */ }
    }
    loadCities();
  }, []);

  useEffect(() => {
    fetchSeekers();
  }, [fetchSeekers]);

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

  const filteredCities = citySearch
    ? cities.filter(c =>
        c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
        c.state.toLowerCase().includes(citySearch.toLowerCase())
      )
    : cities;

  const selectedCityLabel = cityFilter
    ? `${cityFilter}${stateFilter ? `, ${stateFilter}` : ""}`
    : "All cities";

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    setDeleteError(null);

    const seeker = pendingDelete;
    setSeekers((prev) => prev.filter((s) => s.id !== seeker.id));
    setTotal((prev) => prev - 1);

    try {
      const res = await fetch(`/api/admin/care-seekers/${seeker.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Deleted ${seeker.display_name}`);
        fetchTabCounts();
        setPendingDelete(null);
      } else {
        setSeekers((prev) => [...prev, seeker].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        setTotal((prev) => prev + 1);
        setDeleteError("Failed to delete care seeker");
      }
    } catch {
      setSeekers((prev) => [...prev, seeker].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setTotal((prev) => prev + 1);
      setDeleteError("Network error");
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setCityFilter("");
    setStateFilter("");
    setFilter("all");
    setDateRange({ preset: "all", customFrom: "", customTo: "" });
    router.replace("/admin/care-seekers");
  }

  const hasActiveFilters = cityFilter || stateFilter || filter !== "all" || dateRange.preset !== "all";

  const tabs: { label: string; value: FilterTab; count: number | null }[] = [
    { label: "All", value: "all", count: tabCounts?.total ?? null },
    { label: "Published", value: "published", count: tabCounts?.published ?? null },
    { label: "Unpublished", value: "unpublished", count: tabCounts?.unpublished ?? null },
    { label: "Needs Nudge", value: "needs_nudge", count: tabCounts?.needsNudge ?? null },
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
          <p className="text-sm text-gray-500">Unpublished</p>
          <p className="text-2xl font-bold text-amber-600">{tabCounts ? tabCounts.unpublished : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-primary-600">{tabCounts ? tabCounts.published : "—"}</p>
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
                <div className="max-h-64 overflow-y-auto">
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
                        <span>{c.city}{c.state ? `, ${c.state}` : ""}</span>
                        <span className="text-xs text-gray-400">{c.count}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date range filter */}
        <DateRangePopover value={dateRange} onChange={setDateRange} />

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

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-6 px-5 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="flex-[2] min-w-0">Care Seeker</div>
          <div className="flex-1">Location</div>
          <div className="flex-1">Nudge Status</div>
          <div className="w-28 text-right">Joined</div>
          <div className="w-8"></div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : seekers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No care seekers found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {seekers.map((seeker) => {
              const meta = seeker.metadata || {};
              const isPublished = meta.care_post?.status === "active";
              const completeness = calculateCompleteness(seeker);
              const location = [seeker.city, seeker.state].filter(Boolean).join(", ");

              return (
                <div
                  key={seeker.id}
                  className="group flex items-center gap-6 px-5 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/care-seekers/${seeker.id}`)}
                >
                  {/* Care Seeker Info */}
                  <div className="flex-[2] min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {seeker.display_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {seeker.email || "No email"}
                    </p>
                    <p className="text-sm mt-0.5">
                      <span className="text-gray-400">{completeness}%</span>
                      <span className="text-gray-300 mx-1.5">·</span>
                      <span className={isPublished ? "text-primary-600" : "text-gray-400"}>
                        {isPublished ? "Published" : "Unpublished"}
                      </span>
                    </p>
                  </div>

                  {/* Location */}
                  <div className="flex-1">
                    {location ? (
                      <p className="text-sm text-gray-600">{location}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No location</p>
                    )}
                  </div>

                  {/* Nudge Status */}
                  <div className="flex-1">
                    {(() => {
                      const status = getNudgeStatus(seeker);
                      return (
                        <>
                          <p className={`text-sm ${status.isSuccess ? "text-emerald-600 font-medium" : "text-gray-600"}`}>
                            {status.label}
                          </p>
                          <p className="text-xs text-gray-400">{status.sublabel}</p>
                        </>
                      );
                    })()}
                  </div>

                  {/* Joined */}
                  <div className="w-28 text-right">
                    <p className="text-sm text-gray-400">
                      {formatJoinedDate(seeker.created_at)}
                    </p>
                  </div>

                  {/* Delete */}
                  <div className="w-8">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteError(null);
                        setPendingDelete(seeker);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-gray-300 hover:text-red-500 p-1"
                      aria-label="Delete this care seeker"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-seeker-title"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 id="delete-seeker-title" className="text-base font-semibold text-gray-900 mb-3">
              Delete this care seeker?
            </h3>
            <dl className="text-sm text-gray-700 space-y-1.5 mb-4">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Name</dt>
                <dd className="text-gray-900">{pendingDelete.display_name}</dd>
              </div>
              {pendingDelete.email && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-gray-400">Email</dt>
                  <dd className="text-gray-900">{pendingDelete.email}</dd>
                </div>
              )}
              {pendingDelete.city && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-gray-400">Location</dt>
                  <dd className="text-gray-900">
                    {pendingDelete.city}{pendingDelete.state ? `, ${pendingDelete.state}` : ""}
                  </dd>
                </div>
              )}
            </dl>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
              This will permanently delete this care seeker and all their connections. This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-[12px] text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
