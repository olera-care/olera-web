"use client";

import { useState } from "react";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  relationship: string;
  created_at: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  client: "Client",
  employer: "Employer",
  supervisor: "Supervisor",
  coworker: "Coworker",
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const w = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${w} ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <svg
            className={`w-7 h-7 transition-colors ${
              star <= (hover || value) ? "text-amber-400" : "text-gray-200"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({
  studentProfileId,
  studentFirstName,
  reviews: initialReviews,
}: {
  studentProfileId: string;
  studentFirstName: string;
  reviews: Review[];
}) {
  const [reviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [relationship, setRelationship] = useState("client");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) { setError("Please select a rating"); return; }
    if (comment.trim().length < 50) { setError("Review must be at least 50 characters"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/medjobs/student-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId,
          reviewerName: reviewerName.trim(),
          reviewerEmail: reviewerEmail.trim() || undefined,
          rating,
          comment: comment.trim(),
          relationship,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit review"); return; }
      setSubmitted(true);
      setShowForm(false);
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  // Nothing to show and form not open
  if (reviews.length === 0 && !showForm && !submitted) {
    return (
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Write a review
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Write a review
          </button>
        )}
      </div>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
          <div>
            <StarRating rating={Math.round(avgRating)} size="md" />
            <p className="text-xs text-gray-400 mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Review cards */}
      {reviews.length > 0 && (
        <div className="space-y-4 mb-4">
          {reviews.map((review) => (
            <div key={review.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={review.rating} />
                <span className="text-xs text-gray-400">{RELATIONSHIP_LABELS[review.relationship] || review.relationship}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              <p className="mt-1.5 text-xs text-gray-400">
                — {review.reviewer_name}, {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Submitted confirmation */}
      {submitted && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-sm text-emerald-700 font-medium">Thank you! Your review has been submitted and is pending approval.</p>
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-gray-200 space-y-4">
          <p className="text-sm font-medium text-gray-900">Leave a review for {studentFirstName}</p>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Rating *</label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Your name *</label>
            <input
              type="text"
              required
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              placeholder="Optional — for verification"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Relationship *</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white"
            >
              <option value="client">Client</option>
              <option value="employer">Employer</option>
              <option value="supervisor">Supervisor</option>
              <option value="coworker">Coworker</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Review *</label>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={`Share your experience working with ${studentFirstName}...`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">{comment.length}/50 minimum characters</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
