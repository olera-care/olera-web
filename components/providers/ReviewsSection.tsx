"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import { setDeferredAction } from "@/lib/deferred-action";
import type { Review } from "@/lib/types";

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
}

type SortOption = "helpful" | "recent" | "highest" | "lowest";

const SORT_LABELS: Record<SortOption, string> = {
  helpful: "Most Helpful",
  recent: "Most Recent",
  highest: "Highest Rated",
  lowest: "Lowest Rated",
};

const RELATIONSHIP_OPTIONS = [
  "Family Member of Resident",
  "Daughter of Resident",
  "Son of Resident",
  "Spouse of Resident",
  "Grandchild of Resident",
  "Friend of Resident",
  "Resident",
  "Family Member of Client",
  "Client",
  "Other",
];

const INITIAL_VISIBLE = 4;

// ── Props ──

interface ReviewsSectionProps {
  providerId: string;
  providerSlug: string;
  mockReviews: MockReview[];
}

// ── Component ──

export default function ReviewsSection({ providerId, providerSlug, mockReviews }: ReviewsSectionProps) {
  const { user, openAuth } = useAuth();

  // Data
  const [realReviews, setRealReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("helpful");
  const [sortOpen, setSortOpen] = useState(false);
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(new Set());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formRelationship, setFormRelationship] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

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
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
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

  // ── Submit review ──

  async function handleSubmit() {
    setSubmitError("");

    if (!formRating) {
      setSubmitError("Please select a star rating.");
      return;
    }
    if (formComment.trim().length < 50) {
      setSubmitError("Review must be at least 50 characters.");
      return;
    }
    if (!formRelationship) {
      setSubmitError("Please select your relationship.");
      return;
    }

    // Auth-on-submit: if not signed in, save deferred action + prompt auth
    if (!user) {
      setDeferredAction({
        action: "review",
        targetProfileId: providerId,
        returnUrl: `/provider/${providerSlug}`,
      });
      openAuth({
        defaultMode: "sign-up",
        intent: "family",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          rating: formRating,
          title: formTitle.trim() || undefined,
          comment: formComment.trim(),
          relationship: formRelationship,
        }),
      });

      if (res.status === 409) {
        setSubmitError("You have already reviewed this provider.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSubmitError(data?.error || "Failed to submit review. Please try again.");
        return;
      }

      const data = await res.json();
      setRealReviews((prev) => [data.review, ...prev]);
      setShowForm(false);
      setFormRating(0);
      setHoverRating(0);
      setFormTitle("");
      setFormComment("");
      setFormRelationship("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch {
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──

  return (
    <div className="py-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 font-serif mb-6">What families are saying</h2>

      {hasReviews ? (
        <>
          {/* Sort + count bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 text-sm text-gray-700 font-medium border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                Sort by: {SORT_LABELS[sortBy]}
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
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
                <div key={review.id} className="border border-gray-100 rounded-xl p-5">
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
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              {showForm ? "Cancel" : "Add review"}
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
          <StarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" filled={false} />
          <p className="text-gray-500 font-medium">No reviews yet.</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Be the first to share your experience with this provider.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Write a review
          </button>
        </div>
      )}

      {/* Success toast */}
      {submitSuccess && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          Your review has been published. Thank you for sharing your experience!
        </div>
      )}

      {/* ── Inline Review Form ── */}
      {showForm && (
        <div ref={formRef} id="review-form" className="mt-6 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Write a Review</h3>

          {/* Star rating */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setFormRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <StarIcon
                    className={`w-8 h-8 ${
                      star <= (hoverRating || formRating)
                        ? "text-yellow-400"
                        : "text-gray-200"
                    }`}
                    filled={star <= (hoverRating || formRating)}
                  />
                </button>
              ))}
              {formRating > 0 && (
                <span className="ml-2 text-sm text-gray-500 self-center">
                  {formRating === 1 ? "Poor" : formRating === 2 ? "Fair" : formRating === 3 ? "Good" : formRating === 4 ? "Very Good" : "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Title (optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your review *</label>
            <textarea
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              placeholder="Share details about your experience with this provider..."
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className={`text-xs mt-1 ${formComment.trim().length < 50 ? "text-gray-400" : "text-green-500"}`}>
              {formComment.trim().length}/50 minimum characters
            </p>
          </div>

          {/* Relationship */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your relationship *</label>
            <select
              value={formRelationship}
              onChange={(e) => setFormRelationship(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Select your relationship</option>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setSubmitError(""); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
