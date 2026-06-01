"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import RequestEngagementSection from "@/components/admin/reviews/RequestEngagementSection";

// ── Types ──

type MainTab = "moderation" | "olera" | "flagged";
type StatusFilter = "all" | "published" | "under_review" | "rejected" | "removed";
type OleraFilter = "all" | "flagged" | "not_flagged";

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

interface ReviewStats {
  total_reviews: number;
  olera_reviews: number;
  flagged_count: number;
  requests_sent: number;
}

// ── Main Page Component ──

export default function AdminReviewsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("moderation");
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  // Fetch stats for summary cards + flagged count for badge (3 parallel calls)
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/reviews?limit=1").then((r) => r.json()),
      fetch("/api/admin/olera-reviews?limit=1").then((r) => r.json()),
      fetch("/api/admin/review-requests?period=all").then((r) => r.json()),
    ])
      .then(([reviewsData, oleraData, requestsData]) => {
        const flagged = oleraData.flagged_count ?? 0;
        setFlaggedCount(flagged); // For tab badge
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
    { label: "Moderation", value: "moderation" },
    { label: "Olera Reviews", value: "olera" },
    { label: "Flagged Queue", value: "flagged", badge: flaggedCount },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-lg text-gray-600 mt-1">
          Moderate reviews and manage flagged content.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats ? stats.total_reviews.toLocaleString() : "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Olera Reviews</p>
          <p className="text-2xl font-bold text-primary-600">
            {stats ? stats.olera_reviews.toLocaleString() : "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Flagged Queue</p>
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
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {mainTab === "moderation" && <ModerationTab />}
      {mainTab === "olera" && <OleraReviewsTab onFlaggedCountChange={setFlaggedCount} />}
      {mainTab === "flagged" && <FlaggedQueueTab onFlaggedCountChange={setFlaggedCount} />}
    </div>
  );
}

// ── Moderation Tab (existing functionality) ──

function ModerationTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ status: filter });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setCount(data.count ?? 0);
      } else {
        setError("Failed to load reviews. Please try again.");
      }
    } catch {
      setError("Failed to load reviews. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleAction(id: string, action: "approve" | "reject" | "remove") {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data.review } : r))
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Failed to ${action} review.`);
      }
    } catch {
      setActionError(`Failed to ${action} review. Please check your connection.`);
    } finally {
      setActionLoading(null);
    }
  }

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Under Review", value: "under_review" },
    { label: "Rejected", value: "rejected" },
    { label: "Removed", value: "removed" },
  ];

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Reviews from the legacy system.
        {!loading && <span className="ml-2">({count} total)</span>}
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
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
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by reviewer name or provider slug..."
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Comment</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Source</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
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
                      {review.provider_reply && (
                        <div className="mt-2 pl-3 border-l-2 border-primary-200">
                          <p className="text-xs text-gray-500">Provider reply:</p>
                          <p className="text-xs text-gray-600">{truncate(review.provider_reply, 80)}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(review.status)}>
                        {review.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {review.migration_source ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          v1.0
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">organic</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {review.status !== "published" && (
                          <button
                            onClick={() => handleAction(review.id, "approve")}
                            disabled={actionLoading === review.id}
                            className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                          >
                            Publish
                          </button>
                        )}
                        {review.status !== "rejected" && review.status !== "removed" && (
                          <button
                            onClick={() => handleAction(review.id, "reject")}
                            disabled={actionLoading === review.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        {review.status !== "removed" && (
                          <button
                            onClick={() => handleAction(review.id, "remove")}
                            disabled={actionLoading === review.id}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          >
                            Remove
                          </button>
                        )}
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

// ── Olera Reviews Tab ──

function OleraReviewsTab({ onFlaggedCountChange }: { onFlaggedCountChange: (count: number) => void }) {
  const [reviews, setReviews] = useState<OleraReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OleraFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ flagged: filter });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/olera-reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setTotal(data.total ?? 0);
        onFlaggedCountChange(data.flagged_count ?? 0);
      } else {
        setError("Failed to load reviews. Please try again.");
      }
    } catch {
      setError("Failed to load reviews. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, onFlaggedCountChange]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleFlag(id: string, flag: boolean) {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/olera-reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: flag ? "flag" : "unflag" }),
      });
      if (res.ok) {
        fetchReviews();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Failed to update review.");
      }
    } catch {
      setActionError("Failed to update review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this review? This cannot be undone.")) return;

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

  const tabs: { label: string; value: OleraFilter }[] = [
    { label: "All", value: "all" },
    { label: "Visible", value: "not_flagged" },
    { label: "Flagged", value: "flagged" },
  ];

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Reviews submitted through Olera (providers without Google Place ID).
        {!loading && <span className="ml-2">({total} total)</span>}
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
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
          </button>
        ))}
      </div>

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
          <p className="text-gray-500">No Olera reviews found.</p>
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
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
                      <p className="text-xs text-gray-400">{review.provider_slug}</p>
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
                    </td>
                    <td className="px-6 py-4">
                      {review.flagged ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                          Visible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {review.flagged && (
                          <button
                            onClick={() => handleFlag(review.id, false)}
                            disabled={actionLoading === review.id}
                            className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                          >
                            Unflag
                          </button>
                        )}
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

// ── Flagged Queue Tab ──

function FlaggedQueueTab({ onFlaggedCountChange }: { onFlaggedCountChange: (count: number) => void }) {
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
        setActionError(data.error || "Failed to unflag review.");
      }
    } catch {
      setActionError("Failed to unflag review. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this review? This cannot be undone.")) return;

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
          <strong>Provider-flagged reviews</strong> — These reviews were flagged by providers for your attention.
          Review the content and decide whether to keep them hidden or make them visible again.
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Provider Email</th>
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
                    </td>
                    <td className="px-6 py-4">
                      {review.provider_email ? (
                        <a
                          href={`mailto:${review.provider_email}`}
                          className="text-sm text-gray-600 hover:text-primary-600"
                        >
                          {review.provider_email}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
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

function getStatusVariant(status: string): "pending" | "verified" | "rejected" | "default" {
  switch (status) {
    case "under_review":
      return "pending";
    case "published":
      return "verified";
    case "rejected":
    case "removed":
      return "rejected";
    default:
      return "default";
  }
}
