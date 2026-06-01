"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import RequestEngagementSection from "@/components/admin/reviews/RequestEngagementSection";

// ── Types ──

type MainTab = "all" | "flagged" | "removed";

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
}

// ── Main Page Component ──

export default function AdminReviewsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("all");
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [removedCount, setRemovedCount] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  // Fetch stats for summary cards + counts for badges
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/reviews?limit=1").then((r) => r.json()),
      fetch("/api/admin/olera-reviews?limit=1").then((r) => r.json()),
      fetch("/api/admin/review-requests?period=all").then((r) => r.json()),
      fetch("/api/admin/reviews?status=rejected&limit=1").then((r) => r.json()),
      fetch("/api/admin/reviews?status=removed&limit=1").then((r) => r.json()),
    ])
      .then(([reviewsData, oleraData, requestsData, rejectedData, removedData]) => {
        const flagged = oleraData.flagged_count ?? 0;
        setFlaggedCount(flagged);
        setRemovedCount((rejectedData.count ?? 0) + (removedData.count ?? 0));
        setStats({
          total_reviews: reviewsData.count ?? 0,
          olera_reviews: oleraData.total ?? 0,
          flagged_count: flagged,
          requests_sent: requestsData.summary?.total_requests ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const mainTabs: { label: string; value: MainTab; badge?: number }[] = [
    { label: "All Reviews", value: "all" },
    { label: "Flagged", value: "flagged", badge: flaggedCount },
    { label: "Removed", value: "removed", badge: removedCount > 0 ? removedCount : undefined },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-lg text-gray-600 mt-1">
          Manage reviews across all sources.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats ? (stats.total_reviews + stats.olera_reviews).toLocaleString() : "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Guest Reviews</p>
          <p className="text-2xl font-bold text-primary-600">
            {stats ? stats.olera_reviews.toLocaleString() : "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Flagged</p>
          <p className="text-2xl font-bold text-amber-600">
            {stats ? stats.flagged_count.toLocaleString() : "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Review Requests Sent</p>
          <p className="text-2xl font-bold text-emerald-600">
            {stats ? stats.requests_sent.toLocaleString() : "-"}
          </p>
        </div>
      </div>

      {/* Request Engagement collapsible section */}
      <RequestEngagementSection />

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
      {mainTab === "all" && <AllReviewsTab />}
      {mainTab === "flagged" && <FlaggedTab onFlaggedCountChange={setFlaggedCount} />}
      {mainTab === "removed" && <RemovedTab onCountChange={setRemovedCount} />}
    </div>
  );
}

// ── All Reviews Tab (combines both sources) ──

function AllReviewsTab() {
  const [reviews, setReviews] = useState<UnifiedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from both sources in parallel
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);

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
  }, [debouncedSearch]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleRemove(review: UnifiedReview) {
    if (!confirm("Are you sure you want to remove this review?")) return;

    setActionLoading(review.id);
    setActionError(null);
    try {
      const endpoint = review.source === "guest"
        ? `/api/admin/olera-reviews/${review.id}`
        : `/api/admin/reviews/${review.id}`;

      const method = review.source === "guest" ? "DELETE" : "PATCH";
      const body = review.source === "guest" ? undefined : JSON.stringify({ action: "remove" });

      const res = await fetch(endpoint, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });

      if (res.ok) {
        fetchReviews();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to remove review.");
      }
    } catch {
      setActionError("Failed to remove review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by reviewer name or provider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
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
                {reviews.map((review) => (
                  <tr key={`${review.source}-${review.id}`} className="hover:bg-gray-50">
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
                        onClick={() => handleRemove(review)}
                        disabled={actionLoading === review.id}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Flagged Tab ──

function FlaggedTab({ onFlaggedCountChange }: { onFlaggedCountChange: (count: number) => void }) {
  const [reviews, setReviews] = useState<OleraReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/olera-reviews?flagged=flagged");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        onFlaggedCountChange(data.flagged_count ?? 0);
      } else {
        setError("Failed to load flagged reviews. Please try again.");
      }
    } catch {
      setError("Failed to load flagged reviews. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [onFlaggedCountChange]);

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

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/olera-reviews/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchReviews();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to delete review.");
      }
    } catch {
      setActionError("Failed to delete review. Please check your connection.");
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
                          onClick={() => handleDelete(review.id)}
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
    </div>
  );
}

// ── Removed Tab (rejected + removed reviews) ──

function RemovedTab({ onCountChange }: { onCountChange: (count: number) => void }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both rejected and removed reviews
      const [rejectedRes, removedRes] = await Promise.all([
        fetch("/api/admin/reviews?status=rejected"),
        fetch("/api/admin/reviews?status=removed"),
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
  }, [onCountChange]);

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

  return (
    <div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-gray-600">
          Reviews that have been rejected or removed. You can restore them to make them visible again.
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
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
                      <Badge variant="rejected">
                        {review.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <SourceBadge source={review.migration_source ? "v1.0" : "family"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRestore(review.id)}
                        disabled={actionLoading === review.id}
                        className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
