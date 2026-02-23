"use client";

import { useState, useMemo } from "react";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import type { ExtendedMetadata } from "@/lib/profile-completeness";

// ── Star icon ──

function StarIcon({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      {filled ? (
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      ) : (
        <path
          fillRule="evenodd"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          clipRule="evenodd"
          opacity={0.15}
        />
      )}
    </svg>
  );
}

// ── Copy icon ──

function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}

// ── Check icon ──

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ── Mail icon ──

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

// ── Inline keyframes ──

const floatKeyframes = `
@keyframes reviewFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
`;

// ── Main page ──

export default function ProviderReviewsPage() {
  const profile = useProviderProfile();
  const { metadata, loading } = useProviderDashboardData(profile);

  const [linkCopied, setLinkCopied] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  // Derive review data
  const { reviews, displayRating, reviewCount, hasReviews } = useMemo(() => {
    const meta = metadata as ExtendedMetadata;
    const revs = meta?.reviews || [];
    const avg = revs.length > 0
      ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
      : 0;
    return {
      reviews: revs,
      displayRating: meta?.rating ?? avg,
      reviewCount: meta?.review_count ?? revs.length,
      hasReviews: revs.length > 0,
    };
  }, [metadata]);

  // Review URL
  const reviewUrl = typeof window !== "undefined" && profile?.slug
    ? `${window.location.origin}/provider/${profile.slug}`
    : "";

  // Copy link
  const handleCopyLink = async () => {
    if (!reviewUrl) return;
    try {
      await navigator.clipboard.writeText(reviewUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = reviewUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Quick send via mailto
  const handleQuickSend = () => {
    if (!recipientEmail.trim() || !profile) return;
    const providerName = profile.display_name;
    const name = recipientName.trim() || "there";

    const subject = encodeURIComponent(
      `${providerName} would love your feedback`
    );
    const body = encodeURIComponent(
      `Hi ${name},\n\n` +
      `Thank you for choosing ${providerName}. Your feedback helps other families find quality care.\n\n` +
      `We'd really appreciate it if you could take a moment to share your experience:\n\n` +
      `${reviewUrl}\n\n` +
      `Thank you!\n` +
      `${providerName}`
    );

    window.location.href = `mailto:${recipientEmail.trim()}?subject=${subject}&body=${body}`;
  };

  // ── Loading skeleton ──

  if (!profile || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-5 w-28 bg-gray-200 rounded mb-3" />
              <div className="h-3.5 w-full bg-gray-100 rounded mb-6" />
              <div className="h-10 bg-gray-100 rounded-lg mb-6" />
              <div className="border-t border-gray-100 my-5" />
              <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-10 bg-gray-100 rounded-lg mb-3" />
              <div className="h-10 bg-gray-100 rounded-lg mb-3" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                    <div>
                      <div className="h-3.5 w-24 bg-gray-200 rounded" />
                      <div className="h-3 w-16 bg-gray-100 rounded mt-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          Collect and showcase feedback from families and clients
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* ── Left: Get Reviews card ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">
              Get Reviews
            </h2>
            <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
              Share your review link with past or current clients to collect feedback.
            </p>

            {/* Review link */}
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Your review link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-600 truncate select-all">
                {reviewUrl || `olera.co/provider/${profile.slug}`}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  linkCopied
                    ? "bg-emerald-500 text-white"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                {linkCopied ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-gray-100 my-6" />

            {/* Quick send */}
            <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
              Quick send
            </h3>
            <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
              Email a review request directly from your email client.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Recipient name <span className="text-gray-300 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Recipient email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. sarah@email.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 placeholder:text-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={handleQuickSend}
                disabled={!recipientEmail.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MailIcon className="w-4 h-4" />
                Open in email client
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Your Reviews ── */}
        <div className="lg:col-span-3">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-5">
            Your Reviews
          </h2>

          {hasReviews ? (
            <>
              {/* Stats row */}
              <div className="flex items-center gap-5 mb-6 bg-gray-50 rounded-xl p-5">
                <span className="text-4xl font-bold text-gray-900 tabular-nums leading-none">
                  {displayRating > 0 ? displayRating.toFixed(1) : "—"}
                </span>
                <div>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        filled={star <= Math.round(displayRating)}
                        className={`w-[18px] h-[18px] ${
                          star <= Math.round(displayRating) ? "text-yellow-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] text-gray-500">
                    {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Review cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review, index) => {
                  const initials = review.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={index}
                      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-all duration-200"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-gray-500">
                              {initials}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {review.name}
                            </p>
                            <p className="text-xs text-gray-400">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 ml-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              filled={star <= review.rating}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating ? "text-yellow-400" : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Relationship */}
                      {review.relationship && (
                        <span className="inline-block text-[11px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mb-2">
                          {review.relationship}
                        </span>
                      )}

                      {/* Comment */}
                      <p className="text-[13px] text-gray-600 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── Empty state ── */
            <div className="flex flex-col items-center text-center py-16 px-8">
              <div
                className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-5"
                style={{ animation: "reviewFloat 3s ease-in-out infinite" }}
              >
                <StarIcon filled className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                No reviews yet
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[340px]">
                Reviews help families feel confident about choosing you. Share your
                review link to start collecting feedback.
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                {linkCopied ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Link copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    Copy your review link
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
