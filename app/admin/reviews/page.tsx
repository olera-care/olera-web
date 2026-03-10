"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";

type StatusFilter = "all" | "published" | "under_review" | "rejected" | "removed";

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

export default function AdminReviewsPage() {
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

  // Debounce search input
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
        // Update in place instead of removing
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-lg text-gray-600 mt-1">
          View and moderate reviews across all providers.
          {!loading && <span className="ml-2 text-sm text-gray-400">({count} total)</span>}
        </p>
      </div>

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
