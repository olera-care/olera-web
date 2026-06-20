"use client";

import { useEffect, useState, useCallback } from "react";
import DateRangePopover, { type DateRangeValue, resolveRange } from "@/components/admin/DateRangePopover";

// ── Types ──

type MainTab = "all" | "flagged" | "removed" | "providers";

interface AdminReview {
  id: string;
  provider_id: string;
  account_id: string | null;
  reviewer_name: string;
  rating: number;
  title: string | null;
  comment: string;
  relationship: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  provider_reply: string | null;
  replied_at: string | null;
  migration_source: string | null;
}

interface OleraReview {
  id: string;
  provider_slug: string;
  provider_name: string;
  provider_email: string | null;
  reviewer_name: string;
  rating: number;
  review_text: string;
  flagged: boolean;
  flagged_at: string | null;
  flagged_reason: string | null;
  created_at: string;
}

// Unified review type for combined display
interface UnifiedReview {
  id: string;
  source: "v1.0" | "family" | "guest";
  provider_id: string;
  provider_name: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  relationship: string | null;
  created_at: string;
  // For family reviews
  status?: string;
  provider_reply?: string | null;
  // For guest reviews
  flagged?: boolean;
  provider_email?: string | null;
}

interface ReviewStats {
  total_reviews: number;
  olera_reviews: number;
  flagged_count: number;
  requests_sent: number;
  providers_requesting: number;
}

// ── Main Page Component ──

export default function AdminReviewsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("all");
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [removedCount, setRemovedCount] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: "all",
    customFrom: "",
    customTo: "",
  });

  // Track stats version to trigger child refreshes
  const [statsVersion, setStatsVersion] = useState(0);

  // Fetch stats for summary cards + counts for badges
  const fetchStats = useCallback(async () => {
    setStatsError(false);
    try {
      const resolved = resolveRange(dateRange);
      const dateParams = new URLSearchParams();
      if (resolved.from) dateParams.set("from_date", resolved.from);
      if (resolved.to) dateParams.set("to_date", resolved.to);
      const dateQuery = dateParams.toString() ? `&${dateParams.toString()}` : "";

      const [publishedData, visibleOleraData, flaggedOleraData, requestsData, rejectedData, removedData] = await Promise.all([
        fetch(`/api/admin/reviews?status=published&limit=1${dateQuery}`).then((r) => r.json()),
        fetch(`/api/admin/olera-reviews?flagged=not_flagged&limit=1${dateQuery}`).then((r) => r.json()),
        fetch(`/api/admin/olera-reviews?flagged=flagged&limit=1${dateQuery}`).then((r) => r.json()),
        fetch("/api/admin/review-requests?period=all").then((r) => r.json()),
        fetch(`/api/admin/reviews?status=rejected&limit=1${dateQuery}`).then((r) => r.json()),
        fetch(`/api/admin/reviews?status=removed&limit=1${dateQuery}`).then((r) => r.json()),
      ]);

      const flagged = flaggedOleraData.total ?? 0;
      const visibleOlera = visibleOleraData.total ?? 0;
      setFlaggedCount(flagged);
      setRemovedCount((rejectedData.count ?? 0) + (removedData.count ?? 0));
      setStats({
        total_reviews: publishedData.count ?? 0,
        olera_reviews: visibleOlera,
        flagged_count: flagged,
        requests_sent: requestsData.summary?.total_requests ?? 0,
        providers_requesting: requestsData.summary?.total_providers ?? 0,
      });
    } catch {
      setStatsError(true);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Callback for child components to trigger stats refresh
  const onStatsChange = useCallback(() => {
    fetchStats();
    setStatsVersion((v) => v + 1);
  }, [fetchStats]);

  const mainTabs: { label: string; value: MainTab; badge?: number }[] = [
    { label: "All Reviews", value: "all" },
    { label: "Flagged", value: "flagged", badge: flaggedCount },
    { label: "Removed", value: "removed", badge: removedCount > 0 ? removedCount : undefined },
    { label: "Providers Requesting", value: "providers", badge: stats?.providers_requesting || undefined },
  ];

  return (
    <div>
      {/* Header with search and date range */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
          <p className="text-lg text-gray-600 mt-1">
            Manage reviews across all sources.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <DateRangePopover value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Stats row */}
      {statsError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm text-red-700">
          Failed to load stats. <button onClick={fetchStats} className="underline">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats ? (stats.total_reviews + stats.olera_reviews).toLocaleString() : "-"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Flagged</p>
            <p className="text-2xl font-bold text-amber-600">
              {stats ? stats.flagged_count.toLocaleString() : "-"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Requests Sent</p>
            <p className="text-2xl font-bold text-emerald-600">
              {stats ? stats.requests_sent.toLocaleString() : "-"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Providers Requesting</p>
            <p className="text-2xl font-bold text-violet-600">
              {stats ? stats.providers_requesting.toLocaleString() : "-"}
            </p>
          </div>
        </div>
      )}

      {/* Main tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {mainTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMainTab(tab.value)}
              className={[
                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                mainTab === tab.value
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={[
                  "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium",
                  tab.value === "flagged" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600",
                ].join(" ")}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {mainTab === "all" && (
        <AllReviewsTab
          dateRange={dateRange}
          search={search}
          onStatsChange={onStatsChange}
          key={`all-${statsVersion}`}
        />
      )}
      {mainTab === "flagged" && (
        <FlaggedTab
          onFlaggedCountChange={setFlaggedCount}
          onStatsChange={onStatsChange}
          dateRange={dateRange}
          key={`flagged-${statsVersion}`}
        />
      )}
      {mainTab === "removed" && (
        <RemovedTab
          onCountChange={setRemovedCount}
          onStatsChange={onStatsChange}
          dateRange={dateRange}
          key={`removed-${statsVersion}`}
        />
      )}
      {mainTab === "providers" && (
        <ProvidersRequestingTab
          search={search}
          dateRange={dateRange}
          onStatsChange={onStatsChange}
          key={`providers-${statsVersion}`}
        />
      )}
    </div>
  );
}

// ── All Reviews Tab (combines both sources) ──

interface AllReviewsTabProps {
  dateRange: DateRangeValue;
  search: string;
  onStatsChange: () => void;
}

function AllReviewsTab({ dateRange, search, onStatsChange }: AllReviewsTabProps) {
  const [reviews, setReviews] = useState<UnifiedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Use composite key to avoid collision between sources
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Modal state
  const [pendingAction, setPendingAction] = useState<UnifiedReview | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build params with date range
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);

      const resolved = resolveRange(dateRange);
      if (resolved.from) params.set("from_date", resolved.from);
      if (resolved.to) params.set("to_date", resolved.to);

      const [familyRes, guestRes] = await Promise.all([
        fetch(`/api/admin/reviews?status=published&${params}`),
        fetch(`/api/admin/olera-reviews?flagged=not_flagged&${params}`),
      ]);

      if (!familyRes.ok || !guestRes.ok) {
        setError("Failed to load reviews. Please try again.");
        return;
      }

      const [familyData, guestData] = await Promise.all([
        familyRes.json(),
        guestRes.json(),
      ]);

      // Transform and combine reviews
      const familyReviews: UnifiedReview[] = (familyData.reviews ?? []).map((r: AdminReview) => ({
        id: r.id,
        source: r.migration_source ? "v1.0" : "family",
        provider_id: r.provider_id,
        provider_name: formatSlug(r.provider_id),
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.comment,
        relationship: r.relationship,
        created_at: r.created_at,
        status: r.status,
        provider_reply: r.provider_reply,
      }));

      const guestReviews: UnifiedReview[] = (guestData.reviews ?? []).map((r: OleraReview) => ({
        id: r.id,
        source: "guest",
        provider_id: r.provider_slug,
        provider_name: r.provider_name,
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.review_text,
        relationship: null,
        created_at: r.created_at,
        flagged: r.flagged,
        provider_email: r.provider_email,
      }));

      // Combine and sort by date (newest first)
      const combined = [...familyReviews, ...guestReviews].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setReviews(combined);
    } catch {
      setError("Failed to load reviews. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateRange]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function handleRemoveClick(review: UnifiedReview) {
    setModalError(null);
    setPendingAction(review);
  }

  async function confirmRemove() {
    if (!pendingAction) return;

    const review = pendingAction;
    const isGuest = review.source === "guest";

    setActionLoading(review.id);
    setModalError(null);
    try {
      const endpoint = isGuest
        ? `/api/admin/olera-reviews/${review.id}`
        : `/api/admin/reviews/${review.id}`;

      const method = isGuest ? "DELETE" : "PATCH";
      const body = isGuest ? undefined : JSON.stringify({ action: "remove" });

      const res = await fetch(endpoint, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });

      if (res.ok) {
        setPendingAction(null);
        fetchReviews();
        onStatsChange();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.error || "Failed to remove review.");
      }
    } catch {
      setModalError("Failed to remove review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  // Helper to create composite key for expand toggle
  const getReviewKey = (review: UnifiedReview) => `${review.source}-${review.id}`;

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No reviews found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reviewer</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rating</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Review</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Source</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => {
                  const reviewKey = getReviewKey(review);
                  const isExpanded = expandedKey === reviewKey;
                  return (
                    <tr key={reviewKey} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <a
                          href={`/provider/${review.provider_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          {review.provider_name}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{review.reviewer_name}</p>
                        {review.relationship && (
                          <p className="text-xs text-gray-500">{review.relationship}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-900">{review.rating}</span>
                          <span className="text-amber-400">{renderStars(review.rating)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <button
                          onClick={() => setExpandedKey(isExpanded ? null : reviewKey)}
                          className="text-left"
                        >
                          <p className="text-sm text-gray-700">
                            {isExpanded ? review.comment : truncate(review.comment, 100)}
                          </p>
                          {review.comment.length > 100 && (
                            <span className="text-xs text-primary-600 hover:underline">
                              {isExpanded ? "Show less" : "Show more"}
                            </span>
                          )}
                        </button>
                        {review.provider_reply && (
                          <div className="mt-2 pl-3 border-l-2 border-primary-200">
                            <p className="text-xs text-gray-500">Provider reply:</p>
                            <p className="text-xs text-gray-600">{truncate(review.provider_reply, 80)}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <SourceBadge source={review.source} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(review.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveClick(review)}
                          disabled={actionLoading === review.id}
                          className={[
                            "px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors",
                            review.source === "guest"
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                          ].join(" ")}
                        >
                          {review.source === "guest" ? "Delete" : "Remove"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {pendingAction.source === "guest" ? "Delete this review?" : "Remove this review?"}
            </h3>
            <dl className="text-sm text-gray-700 space-y-1.5 mb-4">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Provider</dt>
                <dd className="text-gray-900">{pendingAction.provider_name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Reviewer</dt>
                <dd className="text-gray-900">{pendingAction.reviewer_name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Rating</dt>
                <dd className="text-gray-900">{pendingAction.rating} {renderStars(pendingAction.rating)}</dd>
              </div>
            </dl>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
              {pendingAction.source === "guest"
                ? "This will permanently delete this guest review. This cannot be undone."
                : "This will remove the review from public view. You can restore it from the Removed tab."}
            </p>
            {modalError && (
              <p className="text-[12px] text-red-600 mb-3">{modalError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingAction(null);
                  setModalError(null);
                }}
                disabled={actionLoading === pendingAction.id}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                disabled={actionLoading === pendingAction.id}
                className={[
                  "text-xs font-medium text-white px-3 py-1.5 rounded-md disabled:opacity-50",
                  pendingAction.source === "guest"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-800",
                ].join(" ")}
              >
                {actionLoading === pendingAction.id
                  ? (pendingAction.source === "guest" ? "Deleting..." : "Removing...")
                  : (pendingAction.source === "guest" ? "Delete" : "Remove")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Flagged Tab ──

interface FlaggedTabProps {
  onFlaggedCountChange: (count: number) => void;
  onStatsChange: () => void;
  dateRange: DateRangeValue;
}

function FlaggedTab({ onFlaggedCountChange, onStatsChange, dateRange }: FlaggedTabProps) {
  const [reviews, setReviews] = useState<OleraReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Modal state
  const [pendingDelete, setPendingDelete] = useState<OleraReview | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("flagged", "flagged");

      const resolved = resolveRange(dateRange);
      if (resolved.from) params.set("from_date", resolved.from);
      if (resolved.to) params.set("to_date", resolved.to);

      const res = await fetch(`/api/admin/olera-reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        // Use total (date-filtered) not flagged_count (all-time)
        onFlaggedCountChange(data.total ?? 0);
      } else {
        setError("Failed to load flagged reviews. Please try again.");
      }
    } catch {
      setError("Failed to load flagged reviews. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [onFlaggedCountChange, dateRange]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleUnflag(id: string) {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/olera-reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unflag" }),
      });
      if (res.ok) {
        fetchReviews();
        onStatsChange(); // Refresh stats after action
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to restore review.");
      }
    } catch {
      setActionError("Failed to restore review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleDeleteClick(review: OleraReview) {
    setModalError(null);
    setPendingDelete(review);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setActionLoading(pendingDelete.id);
    setModalError(null);
    try {
      const res = await fetch(`/api/admin/olera-reviews/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPendingDelete(null);
        fetchReviews();
        onStatsChange();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.error || "Failed to delete review.");
      }
    } catch {
      setModalError("Failed to delete review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Provider-flagged reviews</strong> — These reviews were flagged by providers as inappropriate.
          Review the content and decide whether to restore them or delete permanently.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-500">No flagged reviews to review.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reviewer</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rating</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Review</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Flagged</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        href={`/provider/${review.provider_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        {review.provider_name}
                      </a>
                      {review.provider_email && (
                        <p className="text-xs text-gray-400">{review.provider_email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{review.reviewer_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900">{review.rating}</span>
                        <span className="text-amber-400">{renderStars(review.rating)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <button
                        onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                        className="text-left"
                      >
                        <p className="text-sm text-gray-700">
                          {expandedId === review.id
                            ? review.review_text
                            : truncate(review.review_text, 100)}
                        </p>
                        {review.review_text.length > 100 && (
                          <span className="text-xs text-primary-600 hover:underline">
                            {expandedId === review.id ? "Show less" : "Show more"}
                          </span>
                        )}
                      </button>
                      {review.flagged_reason && (
                        <p className="text-xs text-amber-600 mt-1">
                          Reason: {review.flagged_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {review.flagged_at
                        ? new Date(review.flagged_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUnflag(review.id)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteClick(review)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Delete this flagged review?
            </h3>
            <dl className="text-sm text-gray-700 space-y-1.5 mb-4">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Provider</dt>
                <dd className="text-gray-900">{pendingDelete.provider_name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Reviewer</dt>
                <dd className="text-gray-900">{pendingDelete.reviewer_name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Rating</dt>
                <dd className="text-gray-900">{pendingDelete.rating} {renderStars(pendingDelete.rating)}</dd>
              </div>
              {pendingDelete.flagged_reason && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-gray-400">Reason</dt>
                  <dd className="text-amber-600">{pendingDelete.flagged_reason}</dd>
                </div>
              )}
            </dl>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
              This will permanently delete this review. This cannot be undone.
            </p>
            {modalError && (
              <p className="text-[12px] text-red-600 mb-3">{modalError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  setModalError(null);
                }}
                disabled={actionLoading === pendingDelete.id}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading === pendingDelete.id}
                className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                {actionLoading === pendingDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Removed Tab (rejected + removed reviews) ──

interface RemovedTabProps {
  onCountChange: (count: number) => void;
  onStatsChange: () => void;
  dateRange: DateRangeValue;
}

function RemovedTab({ onCountChange, onStatsChange, dateRange }: RemovedTabProps) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Modal state
  const [pendingDelete, setPendingDelete] = useState<AdminReview | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resolved = resolveRange(dateRange);
      const dateParams = new URLSearchParams();
      if (resolved.from) dateParams.set("from_date", resolved.from);
      if (resolved.to) dateParams.set("to_date", resolved.to);
      const dateQuery = dateParams.toString() ? `&${dateParams.toString()}` : "";

      // Fetch both rejected and removed reviews
      const [rejectedRes, removedRes] = await Promise.all([
        fetch(`/api/admin/reviews?status=rejected${dateQuery}`),
        fetch(`/api/admin/reviews?status=removed${dateQuery}`),
      ]);

      if (!rejectedRes.ok || !removedRes.ok) {
        setError("Failed to load reviews. Please try again.");
        return;
      }

      const [rejectedData, removedData] = await Promise.all([
        rejectedRes.json(),
        removedRes.json(),
      ]);

      const combined = [
        ...(rejectedData.reviews ?? []),
        ...(removedData.reviews ?? []),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setReviews(combined);
      onCountChange(combined.length);
    } catch {
      setError("Failed to load reviews. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [onCountChange, dateRange]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleRestore(id: string) {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        fetchReviews();
        onStatsChange();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to restore review.");
      }
    } catch {
      setActionError("Failed to restore review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleDeleteClick(review: AdminReview) {
    setModalError(null);
    setPendingDelete(review);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setActionLoading(pendingDelete.id);
    setModalError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPendingDelete(null);
        fetchReviews();
        onStatsChange();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.error || "Failed to delete review.");
      }
    } catch {
      setModalError("Failed to delete review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-gray-600">
          Reviews that have been removed. You can restore them or delete permanently.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No removed reviews.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Reviewer</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rating</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Review</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Source</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        href={`/provider/${review.provider_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        {formatSlug(review.provider_id)}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{review.reviewer_name}</p>
                      {review.relationship && (
                        <p className="text-xs text-gray-500">{review.relationship}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900">{review.rating}</span>
                        <span className="text-amber-400">{renderStars(review.rating)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <button
                        onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                        className="text-left"
                      >
                        <p className="text-sm text-gray-700">
                          {expandedId === review.id
                            ? review.comment
                            : truncate(review.comment, 100)}
                        </p>
                        {review.comment.length > 100 && (
                          <span className="text-xs text-primary-600 hover:underline">
                            {expandedId === review.id ? "Show less" : "Show more"}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <SourceBadge source={review.migration_source ? "v1.0" : "family"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleRestore(review.id)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteClick(review)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Permanently delete this review?
            </h3>
            <dl className="text-sm text-gray-700 space-y-1.5 mb-4">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Provider</dt>
                <dd className="text-gray-900">{formatSlug(pendingDelete.provider_id)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Reviewer</dt>
                <dd className="text-gray-900">{pendingDelete.reviewer_name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Rating</dt>
                <dd className="text-gray-900">{pendingDelete.rating} {renderStars(pendingDelete.rating)}</dd>
              </div>
            </dl>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
              This will permanently delete this review from the database. This cannot be undone.
            </p>
            {modalError && (
              <p className="text-[12px] text-red-600 mb-3">{modalError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  setModalError(null);
                }}
                disabled={actionLoading === pendingDelete.id}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading === pendingDelete.id}
                className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                {actionLoading === pendingDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Providers Requesting Tab ──

interface ProviderEngagement {
  id: string;
  display_name: string;
  slug: string;
  requests_sent: number;
  requests_this_month: number;
  olera_reviews_count: number;
  google_connected: boolean;
  last_request_at: string | null;
}

interface ProvidersRequestingTabProps {
  search: string;
  dateRange: DateRangeValue;
  onStatsChange: () => void;
}

const PAGE_SIZE = 20;

function ProvidersRequestingTab({ search, dateRange, onStatsChange }: ProvidersRequestingTabProps) {
  const [providers, setProviders] = useState<ProviderEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProviders = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setProviders([]);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      const resolved = resolveRange(dateRange);
      if (resolved.from) params.set("from_date", resolved.from);
      if (resolved.to) params.set("to_date", resolved.to);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("limit", String(PAGE_SIZE));
      if (loadMore) params.set("offset", String(providers.length));

      const res = await fetch(`/api/admin/review-requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        const newProviders = data.providers ?? [];
        if (loadMore) {
          setProviders(prev => [...prev, ...newProviders]);
        } else {
          setProviders(newProviders);
        }
        setTotal(data.total ?? 0);
        setHasMore(newProviders.length === PAGE_SIZE);
      } else {
        setError("Failed to load providers. Please try again.");
      }
    } catch {
      setError("Failed to load providers. Please check your connection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, dateRange, providers.length]);

  useEffect(() => {
    fetchProviders(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, dateRange]);

  const handleDelete = useCallback(async (providerId: string, providerName: string) => {
    if (!confirm(`Delete all review request records for "${providerName}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(providerId);
    try {
      const res = await fetch("/api/admin/review-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });

      if (res.ok) {
        // Remove from local state
        setProviders(prev => prev.filter(p => p.id !== providerId));
        setTotal(prev => prev - 1);
        // Refresh stats cards at top of page
        onStatsChange();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete records");
      }
    } catch {
      setError("Failed to delete records. Please try again.");
    } finally {
      setDeleting(null);
    }
  }, [onStatsChange]);

  return (
    <div>
      <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-violet-800">
          <strong>Provider review request activity</strong> — See which providers are requesting reviews
          and track their cumulative request counts and received reviews.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {search ? "No providers found matching your search." : "No providers have requested reviews yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Total Requests Sent</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">This Month</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Guest Reviews</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Google Connected</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Last Request</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((provider) => (
                  <tr key={provider.id} className="group hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        href={`/provider/${provider.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        {provider.display_name}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {provider.requests_sent}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {provider.requests_this_month}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={[
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        provider.olera_reviews_count > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600",
                      ].join(" ")}>
                        {provider.olera_reviews_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {provider.google_connected ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Connected
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {provider.last_request_at
                        ? new Date(provider.last_request_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(provider.id, provider.display_name)}
                        disabled={deleting === provider.id}
                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="Delete review request records"
                      >
                        {deleting === provider.id ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load more / pagination info */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {providers.length} of {total} providers
            </p>
            {hasMore && (
              <button
                onClick={() => fetchProviders(true)}
                disabled={loadingMore}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper Components ──

function SourceBadge({ source }: { source: "v1.0" | "family" | "guest" }) {
  const styles = {
    "v1.0": "bg-blue-50 text-blue-700",
    family: "bg-purple-50 text-purple-700",
    guest: "bg-teal-50 text-teal-700",
  };

  const labels = {
    "v1.0": "v1.0",
    family: "Family",
    guest: "Guest",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[source]}`}>
      {labels[source]}
    </span>
  );
}

// ── Helper Functions ──

function renderStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function formatSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
