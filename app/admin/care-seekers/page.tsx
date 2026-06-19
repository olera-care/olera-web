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
  profile_complete: boolean;   // ≥60% (ready to publish)
  fully_complete: boolean;     // 100% (no more nudges needed)
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

interface EngagementFunnel {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  improved: number | null; // null for prior period (can't measure historically)
  completed: number | null;
  published: number;
  totalLift?: number;
  improvedCount?: number;
  avgLift?: number;
}

interface EngagementRates {
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface WeeklyData {
  week: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  improved: number;
  published: number;
}

interface EngagementData {
  funnel: EngagementFunnel;
  rates: EngagementRates;
  prior: {
    funnel: EngagementFunnel;
    rates: EngagementRates;
  };
  bySequence: {
    completion: EngagementFunnel;
    publish: EngagementFunnel;
  };
  trend: WeeklyData[];
  windowDays: number;
}

// Enrichment funnel types
interface EnrichmentFunnelData {
  funnel: {
    started: number;
    step1_completed: number;
    step2_completed: number;
    step3_completed: number;
    step4_completed: number;
    step5_completed: number;
    step6_completed: number;
    step7_completed: number;  // Go Live
    completed: number;
    skipped: number;
    skipsByStep: Record<number, number>;
    rates: {
      step1Rate: number;
      step2Rate: number;
      step3Rate: number;
      step4Rate: number;
      step5Rate: number;
      step6Rate: number;
      step7Rate: number;  // Go Live rate
      completionRate: number;
    };
  };
  byVariant: Record<string, {
    started: number;
    completed: number;
    rates: { completionRate: number };
  }> | null;
  trend: Array<{
    week: string;
    started: number;
    completed: number;
    completionRate: number;
  }>;
}

// Display labels for 6-step enrichment flow (step 3 "Care type" is now pre-filled)
// Maps display step (1-6) to actual tracked step (1,2,4,5,6,7)
const ENRICHMENT_DISPLAY_STEPS = [1, 2, 4, 5, 6, 7]; // Actual step numbers (skipping 3)
const ENRICHMENT_STEP_LABELS: Record<number, string> = {
  1: "Who needs care",
  2: "Timeline",
  // Step 3 (Care type) is pre-filled, not shown
  4: "Care need",
  5: "Payment",
  6: "Details",
  7: "Go Live",
};

// Benefits enrichment flow (3 steps)
const BENEFITS_ENRICHMENT_DISPLAY_STEPS = [1, 2, 3];
const BENEFITS_ENRICHMENT_STEP_LABELS: Record<number, string> = {
  1: "Recipient",
  2: "Timeline",
  3: "Payment",
};

type EnrichmentSource = "provider" | "benefits";

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
// Weights aligned with lib/admin/profile-completeness.ts
function calculateCompleteness(seeker: SeekerRow): number {
  const meta = seeker.metadata || {};

  // Use cached value if available (e.g., MedJobs students)
  if (meta.profile_completeness !== undefined) {
    return meta.profile_completeness;
  }

  // Check if name is a real name (not placeholder "Care Seeker" - case insensitive)
  const hasRealName = !!seeker.display_name && seeker.display_name.toLowerCase() !== "care seeker";

  // Weights aligned with lib/admin/profile-completeness.ts (Total: 100)
  const checks: Array<{ weight: number; check: () => boolean }> = [
    // Basic Info (20 total)
    { weight: 2, check: () => !!seeker.image_url },
    { weight: 5, check: () => !!seeker.display_name }, // Placeholder counts
    { weight: 5, check: () => hasRealName }, // Bonus for real name
    { weight: 8, check: () => !!seeker.city }, // Required for Go Live
    // Contact (24 total)
    { weight: 10, check: () => !!seeker.email },
    { weight: 12, check: () => !!seeker.phone }, // Enrichment Step 5
    { weight: 2, check: () => !!meta.contact_preference },
    // Care Recipient (16 total)
    { weight: 10, check: () => !!meta.relationship_to_recipient || !!meta.who_needs_care }, // Enrichment Step 1
    { weight: 2, check: () => !!meta.age },
    { weight: 4, check: () => !!seeker.description || !!meta.about_situation },
    // Care Needs (28 total)
    { weight: 8, check: () => (seeker.care_types?.length ?? 0) > 0 }, // Required for Go Live
    { weight: 6, check: () => (meta.care_needs?.length ?? 0) > 0 }, // Enrichment Step 3
    { weight: 12, check: () => !!meta.timeline }, // Enrichment Step 2
    { weight: 2, check: () => !!meta.schedule_preference },
    // Payment (12 total)
    { weight: 12, check: () => (meta.payment_methods?.length ?? 0) > 0 }, // Enrichment Step 4
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

  // Published AND fully complete (100%) = success (green)
  if (isPublished && seeker.fully_complete) {
    return { label: "Published", sublabel: "Done", isSuccess: true };
  }

  // Opted out
  if (isUnsubscribed) {
    return { label: "Opted out", sublabel: "No emails", isSuccess: false };
  }

  // Determine which sequence they're in
  const sequenceType = seeker.sequence_type; // "completion" or "publish"
  const sequenceLabel = sequenceType === "completion" ? "Profile" : "Publish";

  // Published but not fully complete (< 100%) - show both states
  if (isPublished && !seeker.fully_complete) {
    if (isMaintenancePhase) {
      const lastNudge = seq?.last_nudge_at;
      return {
        label: "Published · incomplete",
        sublabel: lastNudge ? `Monthly · ${timeAgo(lastNudge)}` : "Pending",
        isSuccess: false
      };
    }
    const lastNudge = seq?.last_nudge_at;
    return {
      label: "Published · incomplete",
      sublabel: `${nudgeCount}/4${lastNudge ? ` · ${timeAgo(lastNudge)}` : ""}`,
      isSuccess: false
    };
  }

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

// Helper component for funnel stats
function FunnelStat({
  label,
  value,
  prior,
  format,
  highlight,
  subtitle,
}: {
  label: string;
  value: number | null;
  prior?: number | null;
  format?: "number" | "percent";
  highlight?: boolean;
  subtitle?: string;
}) {
  // Handle null value (can't be measured)
  if (value === null) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
        <div className="text-xl font-semibold tabular-nums text-gray-300">—</div>
        <div className="mt-0.5 text-xs text-gray-400">{label}</div>
      </div>
    );
  }

  // Calculate delta only if prior is a valid number > 0
  const canShowDelta = prior !== undefined && prior !== null && prior > 0;
  const delta = canShowDelta ? ((value - prior) / prior) * 100 : null;
  const arrow = delta === null ? null : delta > 0 ? "↑" : delta < 0 ? "↓" : "→";

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        highlight
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-xl font-semibold tabular-nums text-gray-900">
        {format === "percent" ? `${Math.round(value)}%` : value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs text-gray-500 flex items-center gap-1.5">
        {label}
        {delta !== null && (
          <span
            className={
              delta > 0
                ? "text-emerald-600"
                : delta < 0
                ? "text-red-500"
                : "text-gray-400"
            }
          >
            {arrow} {Math.abs(Math.round(delta))}%
          </span>
        )}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[10px] text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}

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

  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [engagementExpanded, setEngagementExpanded] = useState(false);
  const [bySequenceExpanded, setBySequenceExpanded] = useState(false);
  const [weeklyExpanded, setWeeklyExpanded] = useState(false);
  const engagementFetchedAt = useRef<number>(0);

  // Enrichment funnel state
  const [enrichment, setEnrichment] = useState<EnrichmentFunnelData | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [enrichmentExpanded, setEnrichmentExpanded] = useState(false);
  const [enrichmentByVariantExpanded, setEnrichmentByVariantExpanded] = useState(false);
  const [enrichmentWeeklyExpanded, setEnrichmentWeeklyExpanded] = useState(false);
  // Default to provider CTA enrichment funnel (6 steps)
  const [enrichmentSource, setEnrichmentSource] = useState<EnrichmentSource>("provider");
  const enrichmentFetchedAt = useRef<number>(0);

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

  // Clear engagement cache when date range changes
  useEffect(() => {
    setEngagement(null);
    engagementFetchedAt.current = 0;
  }, [dateRange]);

  // Fetch engagement data when section is expanded (refresh after 5 minutes or date change)
  useEffect(() => {
    if (!engagementExpanded) return;

    const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const shouldRefresh = !engagement || (Date.now() - engagementFetchedAt.current > REFRESH_INTERVAL_MS);

    if (!shouldRefresh) return;

    async function loadEngagement() {
      setEngagementLoading(true);
      try {
        const params = new URLSearchParams();
        const resolved = resolveRange(dateRange);
        if (resolved.from) params.set("from_date", resolved.from);
        if (resolved.to) params.set("to_date", resolved.to);

        const res = await fetch(`/api/admin/care-seekers/engagement?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEngagement(data);
          engagementFetchedAt.current = Date.now();
        }
      } catch { /* ignore */ }
      setEngagementLoading(false);
    }
    loadEngagement();
  }, [engagementExpanded, engagement, dateRange]);

  // Clear enrichment cache when date range or source changes
  useEffect(() => {
    setEnrichment(null);
    enrichmentFetchedAt.current = 0;
  }, [dateRange, enrichmentSource]);

  // Fetch enrichment funnel data when section is expanded (refresh after 5 minutes or date change)
  useEffect(() => {
    if (!enrichmentExpanded) return;

    const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const shouldRefresh = !enrichment || (Date.now() - enrichmentFetchedAt.current > REFRESH_INTERVAL_MS);

    if (!shouldRefresh) return;

    async function loadEnrichment() {
      setEnrichmentLoading(true);
      try {
        const params = new URLSearchParams();
        const resolved = resolveRange(dateRange);
        if (resolved.from) params.set("from_date", resolved.from);
        if (resolved.to) params.set("to_date", resolved.to);
        params.set("source", enrichmentSource);

        const res = await fetch(`/api/admin/analytics/enrichment-funnel?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEnrichment(data);
          enrichmentFetchedAt.current = Date.now();
        }
      } catch { /* ignore */ }
      setEnrichmentLoading(false);
    }
    loadEnrichment();
  }, [enrichmentExpanded, enrichment, dateRange, enrichmentSource]);

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Care Seekers</h1>
          <p className="text-sm text-gray-500 mt-1">Families and individuals looking for care</p>
        </div>
        <DateRangePopover value={dateRange} onChange={setDateRange} />
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

      {/* Nudge Engagement Section */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setEngagementExpanded(!engagementExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${engagementExpanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
          </svg>
          Nudge Engagement
          <span className="text-xs text-gray-400 font-normal">last 30 days</span>
        </button>

        {engagementExpanded && (
          <div className="mt-4">
            {engagementLoading ? (
              <div className="text-sm text-gray-400">Loading engagement data...</div>
            ) : engagement ? (
              <>
                {/* Funnel stats row */}
                <div className="grid grid-cols-6 gap-3 mb-4">
                  <FunnelStat
                    label="Sent"
                    value={engagement.funnel.sent}
                    prior={engagement.prior.funnel.sent}
                  />
                  <FunnelStat
                    label="Delivered"
                    value={engagement.rates.deliveryRate}
                    prior={engagement.prior.rates.deliveryRate}
                    format="percent"
                  />
                  <FunnelStat
                    label="Opened"
                    value={engagement.rates.openRate}
                    prior={engagement.prior.rates.openRate}
                    format="percent"
                  />
                  <FunnelStat
                    label="Clicked"
                    value={engagement.rates.clickRate}
                    prior={engagement.prior.rates.clickRate}
                    format="percent"
                  />
                  <FunnelStat
                    label="Improved"
                    value={engagement.funnel.improved}
                    prior={engagement.prior.funnel.improved}
                    subtitle={engagement.bySequence.completion.avgLift ? `+${engagement.bySequence.completion.avgLift}% avg` : undefined}
                  />
                  <FunnelStat
                    label="Published"
                    value={engagement.funnel.published}
                    prior={engagement.prior.funnel.published}
                    highlight
                  />
                </div>

                {/* By Sequence breakdown */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setBySequenceExpanded(!bySequenceExpanded)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className={`w-2.5 h-2.5 transition-transform ${bySequenceExpanded ? "rotate-90" : ""}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
                    </svg>
                    By sequence
                  </button>
                  {bySequenceExpanded && (
                    <div className="mt-2 pl-4 text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Completion:</span>{" "}
                        {engagement.bySequence.completion.sent} sent, {engagement.bySequence.completion.improved ?? 0} improved
                        {engagement.bySequence.completion.sent > 0 && engagement.bySequence.completion.improved !== null && (
                          <span className="text-gray-400">
                            {" "}({Math.round((engagement.bySequence.completion.improved / engagement.bySequence.completion.sent) * 100)}% conv)
                          </span>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Publish:</span>{" "}
                        {engagement.bySequence.publish.sent} sent, {engagement.bySequence.publish.published} published
                        {engagement.bySequence.publish.sent > 0 && (
                          <span className="text-gray-400">
                            {" "}({Math.round((engagement.bySequence.publish.published / engagement.bySequence.publish.sent) * 100)}% conv)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Weekly breakdown */}
                {engagement.trend.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setWeeklyExpanded(!weeklyExpanded)}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className={`w-2.5 h-2.5 transition-transform ${weeklyExpanded ? "rotate-90" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
                      </svg>
                      Weekly breakdown
                    </button>
                    {weeklyExpanded && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Week of</th>
                              <th className="px-3 py-2 text-right font-medium">Sent</th>
                              <th className="px-3 py-2 text-right font-medium">Delivered</th>
                              <th className="px-3 py-2 text-right font-medium">Opened</th>
                              <th className="px-3 py-2 text-right font-medium">Clicked</th>
                              <th className="px-3 py-2 text-right font-medium">Improved</th>
                              <th className="px-3 py-2 text-right font-medium">Published</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {engagement.trend.map((week) => {
                              const deliveryRate = week.sent > 0 ? Math.round((week.delivered / week.sent) * 100) : 0;
                              const openRate = week.delivered > 0 ? Math.round((week.opened / week.delivered) * 100) : 0;
                              const clickRate = week.opened > 0 ? Math.round((week.clicked / week.opened) * 100) : 0;
                              return (
                                <tr key={week.week} className="text-gray-700">
                                  <td className="px-3 py-2 text-gray-500">
                                    {new Date(week.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">{week.sent}</td>
                                  <td className="px-3 py-2 text-right tabular-nums">{deliveryRate}%</td>
                                  <td className="px-3 py-2 text-right tabular-nums">{openRate}%</td>
                                  <td className="px-3 py-2 text-right tabular-nums">{clickRate}%</td>
                                  <td className="px-3 py-2 text-right tabular-nums">{week.improved}</td>
                                  <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-600">{week.published}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400">Failed to load engagement data</div>
            )}
          </div>
        )}
      </div>

      {/* Enrichment Funnel Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnrichmentExpanded(!enrichmentExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${enrichmentExpanded ? "rotate-90" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
            </svg>
            Enrichment Funnel
            <span className="text-xs text-gray-400 font-normal">
              {enrichmentSource === "benefits" ? "3 steps" : "6 steps"} · last 30 days
            </span>
          </button>

          {/* Source filter */}
          <select
            value={enrichmentSource}
            onChange={(e) => setEnrichmentSource(e.target.value as EnrichmentSource)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
          >
            <option value="provider">Provider CTA</option>
            <option value="benefits">Benefits CTA</option>
          </select>
        </div>

        {enrichmentExpanded && (
          <div className="mt-4">
            {enrichmentLoading ? (
              <div className="text-sm text-gray-400">Loading enrichment data...</div>
            ) : enrichment ? (
              <>
                {/* Funnel cards - different layout for provider (7 cols) vs benefits (4 cols) */}
                {enrichmentSource === "benefits" ? (
                  /* Benefits CTA: 4-Card Funnel (Started + 3 steps) */
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {/* Started */}
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                      <div className="text-xl font-semibold tabular-nums text-gray-900">
                        {enrichment.funnel.started}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">Started</div>
                    </div>

                    {/* Steps 1-3 */}
                    {BENEFITS_ENRICHMENT_DISPLAY_STEPS.map((step, displayIndex) => {
                      const stepKey = `step${step}_completed` as keyof typeof enrichment.funnel;
                      const rateKey = `step${step}Rate` as keyof typeof enrichment.funnel.rates;
                      const completed = enrichment.funnel[stepKey] as number;
                      const rate = enrichment.funnel.rates[rateKey];
                      const skips = enrichment.funnel.skipsByStep[step] || 0;

                      // Find highest drop-off step
                      const prevStep = displayIndex === 0 ? null : BENEFITS_ENRICHMENT_DISPLAY_STEPS[displayIndex - 1];
                      const prevCompleted = prevStep === null
                        ? enrichment.funnel.started
                        : (enrichment.funnel[`step${prevStep}_completed` as keyof typeof enrichment.funnel] as number);
                      const dropOff = prevCompleted > 0 ? Math.round(((prevCompleted - completed) / prevCompleted) * 100) : 0;
                      const isHighestDropOff = displayIndex > 0 && dropOff > 20 && dropOff === Math.max(
                        ...(BENEFITS_ENRICHMENT_DISPLAY_STEPS.map((s, i) => {
                          const prevS = i === 0 ? null : BENEFITS_ENRICHMENT_DISPLAY_STEPS[i - 1];
                          const prev = prevS === null ? enrichment.funnel.started : (enrichment.funnel[`step${prevS}_completed` as keyof typeof enrichment.funnel] as number);
                          const curr = enrichment.funnel[`step${s}_completed` as keyof typeof enrichment.funnel] as number;
                          return prev > 0 ? Math.round(((prev - curr) / prev) * 100) : 0;
                        }))
                      );

                      return (
                        <div
                          key={step}
                          className={`rounded-xl border px-3 py-2.5 ${
                            isHighestDropOff
                              ? "border-amber-300 bg-amber-50/50"
                              : step === 3 // Last step
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="text-xl font-semibold tabular-nums text-gray-900">
                            {rate}%
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500 truncate" title={BENEFITS_ENRICHMENT_STEP_LABELS[step]}>
                            {step}. {BENEFITS_ENRICHMENT_STEP_LABELS[step]}
                          </div>
                          <div className="mt-0.5 text-[10px] text-gray-400 flex items-center gap-1.5">
                            {completed} done
                            {skips > 0 && (
                              <span className="text-amber-500">· {skips} skip</span>
                            )}
                          </div>
                          {isHighestDropOff && (
                            <div className="mt-1 text-[10px] text-amber-600 font-medium">
                              ↓ {dropOff}% drop-off
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Provider CTA: 7-Card Funnel (Started + 6 visible steps, step 3 is pre-filled) */
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {/* Started */}
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                      <div className="text-xl font-semibold tabular-nums text-gray-900">
                        {enrichment.funnel.started}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">Started</div>
                    </div>

                    {/* Steps 1-6 (skipping step 3 which is now pre-filled) */}
                    {ENRICHMENT_DISPLAY_STEPS.map((step, displayIndex) => {
                      const displayStep = displayIndex + 1; // 1-6 for display
                      const stepKey = `step${step}_completed` as keyof typeof enrichment.funnel;
                      const rateKey = `step${step}Rate` as keyof typeof enrichment.funnel.rates;
                      const completed = enrichment.funnel[stepKey] as number;
                      const rate = enrichment.funnel.rates[rateKey];
                      const skips = enrichment.funnel.skipsByStep[step] || 0;

                      // Find highest drop-off step (using actual step data, skipping step 3)
                      const prevStepIndex = displayIndex - 1;
                      const prevActualStep = prevStepIndex < 0 ? null : ENRICHMENT_DISPLAY_STEPS[prevStepIndex];
                      const prevCompleted = prevActualStep === null
                        ? enrichment.funnel.started
                        : (enrichment.funnel[`step${prevActualStep}_completed` as keyof typeof enrichment.funnel] as number);
                      const dropOff = prevCompleted > 0 ? Math.round(((prevCompleted - completed) / prevCompleted) * 100) : 0;
                      const isHighestDropOff = displayIndex > 0 && dropOff > 20 && dropOff === Math.max(
                        ...(ENRICHMENT_DISPLAY_STEPS.map((s, i) => {
                          const prevIdx = i - 1;
                          const prevS = prevIdx < 0 ? null : ENRICHMENT_DISPLAY_STEPS[prevIdx];
                          const prev = prevS === null ? enrichment.funnel.started : (enrichment.funnel[`step${prevS}_completed` as keyof typeof enrichment.funnel] as number);
                          const curr = enrichment.funnel[`step${s}_completed` as keyof typeof enrichment.funnel] as number;
                          return prev > 0 ? Math.round(((prev - curr) / prev) * 100) : 0;
                        }))
                      );

                      return (
                        <div
                          key={step}
                          className={`rounded-xl border px-3 py-2.5 ${
                            isHighestDropOff
                              ? "border-amber-300 bg-amber-50/50"
                              : step === 7 // Last step (Go Live)
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="text-xl font-semibold tabular-nums text-gray-900">
                            {rate}%
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500 truncate" title={ENRICHMENT_STEP_LABELS[step]}>
                            {displayStep}. {ENRICHMENT_STEP_LABELS[step]}
                          </div>
                          <div className="mt-0.5 text-[10px] text-gray-400 flex items-center gap-1.5">
                            {completed} done
                            {skips > 0 && (
                              <span className="text-amber-500">· {skips} skip</span>
                            )}
                          </div>
                          {isHighestDropOff && (
                            <div className="mt-1 text-[10px] text-amber-600 font-medium">
                              ↓ {dropOff}% drop-off
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary row */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>
                    <span className="font-medium text-gray-900">{enrichment.funnel.completed}</span>
                    <span className="text-gray-400"> / </span>
                    <span>{enrichment.funnel.started}</span>
                    <span className="text-gray-500"> completed all {enrichmentSource === "benefits" ? "3" : "6"} steps</span>
                  </span>
                  <span className="text-gray-300">·</span>
                  <span>
                    <span className="font-medium text-emerald-600">{enrichment.funnel.rates.completionRate}%</span>
                    <span className="text-gray-500"> completion rate</span>
                  </span>
                  {enrichment.funnel.skipped > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span>
                        <span className="font-medium text-amber-600">{enrichment.funnel.skipped}</span>
                        <span className="text-gray-500"> skipped</span>
                      </span>
                    </>
                  )}
                </div>

                {/* By Variant breakdown - only show if there's data */}
                {enrichment.byVariant && (() => {
                  const variantsWithData = Object.entries(enrichment.byVariant)
                    .filter(([, data]) => data.started > 0);

                  // Don't show section if no variants have any data
                  if (variantsWithData.length === 0) return null;

                  return (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setEnrichmentByVariantExpanded(!enrichmentByVariantExpanded)}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        <svg
                          className={`w-2.5 h-2.5 transition-transform ${enrichmentByVariantExpanded ? "rotate-90" : ""}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
                        </svg>
                        By CTA variant
                      </button>
                      {enrichmentByVariantExpanded && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Variant</th>
                                <th className="px-3 py-2 text-right font-medium">Started</th>
                                <th className="px-3 py-2 text-right font-medium">Completed</th>
                                <th className="px-3 py-2 text-right font-medium">Rate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {variantsWithData
                                .sort((a, b) => b[1].started - a[1].started)
                                .map(([variant, data]) => (
                                  <tr key={variant} className="text-gray-700">
                                    <td className="px-3 py-2 capitalize font-medium">
                                      {variant === "unknown" ? "No variant" : variant}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">{data.started}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{data.completed}</td>
                                    <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-600">
                                      {data.rates.completionRate}%
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Weekly trend */}
                {enrichment.trend.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setEnrichmentWeeklyExpanded(!enrichmentWeeklyExpanded)}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className={`w-2.5 h-2.5 transition-transform ${enrichmentWeeklyExpanded ? "rotate-90" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.5 3.5l7 6.5-7 6.5V3.5z" />
                      </svg>
                      Weekly trend
                    </button>
                    {enrichmentWeeklyExpanded && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Week of</th>
                              <th className="px-3 py-2 text-right font-medium">Started</th>
                              <th className="px-3 py-2 text-right font-medium">Completed</th>
                              <th className="px-3 py-2 text-right font-medium">Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {enrichment.trend.map((week) => (
                              <tr key={week.week} className="text-gray-700">
                                <td className="px-3 py-2 text-gray-500">
                                  {new Date(week.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{week.started}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{week.completed}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-600">
                                  {week.completionRate}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400">Failed to load enrichment data</div>
            )}
          </div>
        )}
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
