"use client";

import type { GoogleReviewsData } from "@/lib/types";

interface GoogleReviewSnippetsProps {
  googleReviewsData: GoogleReviewsData | null;
  providerName: string;
  placeId: string | null;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const px = size === "md" ? "w-[18px] h-[18px]" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, rating - (star - 1)));
        if (fill >= 0.75) {
          return (
            <svg key={star} className={`${px} text-amber-400`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        } else if (fill >= 0.25) {
          return (
            <svg key={star} className={`${px}`} viewBox="0 0 20 20">
              <defs>
                <linearGradient id={`half-star-${star}`}>
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
              <path fill={`url(#half-star-${star})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        } else {
          return (
            <svg key={star} className={`${px} text-gray-200`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        }
      })}
    </div>
  );
}

function GoogleGIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function GoogleReviewSnippets({
  googleReviewsData,
  providerName,
  placeId,
}: GoogleReviewSnippetsProps) {
  if (!googleReviewsData || !googleReviewsData.reviews.length || googleReviewsData.rating == null) {
    return null;
  }

  const { rating, review_count, reviews } = googleReviewsData;
  const googleMapsUrl = placeId
    ? `https://search.google.com/local/reviews?placeid=${placeId}`
    : `https://www.google.com/maps/search/${encodeURIComponent(providerName)}`;

  return (
    <div id="reviews" className="py-8 scroll-mt-20 border-t border-gray-200">
      {/* Header — warm, human */}
      <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">
        What families are saying
      </h2>

      {/* Rating bar — one clear number, one source */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <StarRating rating={rating} size="md" />
          <span className="text-lg font-semibold text-gray-900">{rating.toFixed(1)}</span>
          <span className="text-sm text-gray-400">·</span>
          <div className="flex items-center gap-1">
            <GoogleGIcon className="w-3.5 h-3.5" />
            <span className="text-sm text-gray-500">
              {review_count.toLocaleString()} review{review_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          See all on Google
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
        </a>
      </div>

      {/* Review cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="border border-gray-100 rounded-xl p-5 bg-gray-50/50"
          >
            {/* Author row */}
            <div className="flex items-center gap-3 mb-3">
              {review.profile_photo_url ? (
                <img
                  src={review.profile_photo_url}
                  alt={review.author_name}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-500">
                    {review.author_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{review.author_name}</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-gray-400">{review.relative_time}</span>
                </div>
              </div>
            </div>

            {/* Review text */}
            {review.text && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                {review.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
