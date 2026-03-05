"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import type { Review } from "@/lib/types";
import ReviewModal from "@/components/providers/ReviewModal";

// ── Icons ──

function StarIcon({ className, filled = true }: { className?: string; filled?: boolean }) {
  return filled ? (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

// ── Types ──

interface MockReview {
  name: string;
  rating: number;
  date: string;
  comment: string;
  relationship?: string;
}

interface DisplayReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  relationship?: string;
  title?: string | null;
  isMock: boolean;
  providerReply?: string | null;
  repliedAt?: string | null;
}

type SortOption = "helpful" | "recent" | "highest" | "lowest";

const SORT_LABELS: Record<SortOption, string> = {
  helpful: "Most Helpful",
  recent: "Most Recent",
  highest: "Highest Rated",
  lowest: "Lowest Rated",
};

const INITIAL_VISIBLE = 4;

// ── Props ──

interface ReviewsSectionProps {
  providerId: string;
  providerSlug: string;
  providerName: string;
  mockReviews: MockReview[];
}

// ── Component ──

export default function ReviewsSection({ providerId, providerSlug, providerName, mockReviews }: ReviewsSectionProps) {
  const { user } = useAuth();

  // Data
  const [realReviews, setRealReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("helpful");
  const [sortOpen, setSortOpen] = useState(false);
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(new Set());

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  // ── Fetch real reviews ──

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?provider_id=${encodeURIComponent(providerId)}`);
      if (res.ok) {
        const data = await res.json();
        setRealReviews(data.reviews ?? []);
      }
    } catch {
      // Silently fail — mock reviews will show
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ── Detect deferred action (returning from auth) ──

  useEffect(() => {
    if (!user) return;
    const deferred = getDeferredAction();
    if (deferred?.action === "review" && deferred?.targetProfileId === providerId) {
      clearDeferredAction();
      setReviewModalOpen(true);
    }
  }, [user, providerId]);

  // ── Close sort dropdown on outside click ──

  useEffect(() => {
    if (!sortOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  // ── Merge + sort reviews ──

  const normalizedMock: DisplayReview[] = mockReviews.map((r, i) => ({
    id: `mock-${i}`,
    name: r.name,
    rating: r.rating,
    date: r.date,
    comment: r.comment,
    relationship: r.relationship,
    title: null,
    isMock: true,
  }));

  const normalizedReal: DisplayReview[] = realReviews.map((r) => ({
    id: r.id,
    name: r.reviewer_name,
    rating: r.rating,
    date: new Date(r.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    comment: r.comment,
    relationship: r.relationship,
    title: r.title,
    isMock: false,
    providerReply: r.provider_reply,
    repliedAt: r.replied_at,
  }));

  // Real reviews take priority; fall back to mock
  const allReviews = normalizedReal.length > 0 ? normalizedReal : normalizedMock;

  function sortReviews(reviews: DisplayReview[]): DisplayReview[] {
    const sorted = [...reviews];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => {
          if (a.isMock && b.isMock) return 0;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      case "helpful":
      default:
        return sorted; // original order
    }
  }

  const sortedReviews = sortReviews(allReviews);
  const visibleReviews = expanded ? sortedReviews : sortedReviews.slice(0, INITIAL_VISIBLE);
  const hasMore = sortedReviews.length > INITIAL_VISIBLE;
  const hasReviews = sortedReviews.length > 0;
  const reviewCount = sortedReviews.length;

  // ── Toggle read more per review ──

  function toggleExpandReview(id: string) {
    setExpandedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Render ──

  return (
    <div className="py-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight mb-6">What families are saying</h2>

      {hasReviews ? (
        <>
          {/* Sort + count bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 text-sm text-gray-700 font-medium border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                Sort by: {SORT_LABELS[sortBy]}
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 min-w-[180px] animate-slide-down">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => { setSortBy(option); setSortOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        sortBy === option
                          ? "text-primary-600 font-medium bg-primary-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {SORT_LABELS[option]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reviews grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleReviews.map((review) => {
              const isLong = review.comment.length > 180;
              const isExpanded = expandedReviewIds.has(review.id);
              const displayComment = isLong && !isExpanded
                ? review.comment.slice(0, 180).trimEnd() + "..."
                : review.comment;

              return (
                <div key={review.id} className="shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">
                          {review.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      {review.rating.toFixed(1)} / 5{" "}
                      <StarIcon className="w-3.5 h-3.5 text-primary-500 inline" />
                    </span>
                  </div>
                  {review.relationship && (
                    <p className="text-xs text-gray-400 mb-2">{review.relationship}</p>
                  )}
                  {review.title && (
                    <p className="text-sm font-semibold text-gray-900 mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {displayComment}{" "}
                    {isLong && (
                      <button
                        onClick={() => toggleExpandReview(review.id)}
                        className="text-primary-600 font-medium"
                      >
                        {isExpanded ? "show less" : "read more"}
                      </button>
                    )}
                  </p>
                  {/* Provider response */}
                  {review.providerReply && (
                    <div className="mt-4 pl-4 border-l-2 border-primary-100 bg-primary-50/30 rounded-r-lg p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-primary-600">Provider Response</span>
                        {review.repliedAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(review.repliedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{review.providerReply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show more / Show less + Add review */}
          <div className="flex items-center justify-between mt-5">
            <div>
              {hasMore && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  Show more
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              )}
              {hasMore && expanded && (
                <button
                  onClick={() => setExpanded(false)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  Show less
                  <ChevronUpIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-xl hover:bg-primary-50 transition-colors"
            >
              Add review
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <StarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" filled={false} />
          <p className="text-gray-500 font-medium">No reviews yet.</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Be the first to share your experience with this provider.</p>
          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-xl hover:bg-primary-50 transition-colors"
          >
            Write a review
          </button>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        providerId={providerId}
        providerSlug={providerSlug}
        providerName={providerName}
        onReviewSubmitted={(review) => setRealReviews((prev) => [review, ...prev])}
      />
    </div>
  );
}
