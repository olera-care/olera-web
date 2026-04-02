"use client";

import { useState, useEffect } from "react";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsReceivedSection({ profileId }: { profileId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/medjobs/student-reviews?studentProfileId=${profileId}`);
        const data = await res.json();
        if (res.ok) setReviews(data.reviews || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [profileId]);

  if (loading) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Reviews from clients and employers will appear here once approved.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={review.rating} />
                <span className="text-xs text-gray-400">
                  {RELATIONSHIP_LABELS[review.relationship] || review.relationship}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              <p className="mt-2 text-xs text-gray-400">
                — {review.reviewer_name}, {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
