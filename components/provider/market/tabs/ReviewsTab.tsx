"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ReviewsContext {
  isFirst: boolean;
  rank: number;
  reviews: number;
  nextCompetitor?: string;
  nextCompetitorReviews?: number;
  reviewsNeeded?: number;
  targetRank?: number;
}

interface TopCompetitor {
  name: string;
  reviews: number;
}

interface ReviewsTabProps {
  reviewsContext: ReviewsContext | null;
  providerSlug?: string;
  providerName?: string;
  hasGooglePlaceId: boolean;
  city?: string;
  providerReviewCount: number | null;
  topCompetitor?: TopCompetitor | null;
}

// Removed "Hi, " since the email template already adds "Hi {name},"
const DEFAULT_MESSAGE = "We'd love to hear about your experience with us. Would you take a moment to leave a review? It helps other families find quality care.";

function isValidEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/**
 * Reviews tab for the Market Action Hub.
 * Gamified review collection with progress toward next competitor.
 */
export default function ReviewsTab({
  reviewsContext,
  providerSlug,
  providerName,
  hasGooglePlaceId,
  city,
  providerReviewCount,
  topCompetitor,
}: ReviewsTabProps) {
  // Form state
  const [clientName, setClientName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSent, setJustSent] = useState(false); // Brief inline success animation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [thisWeekCount, setThisWeekCount] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [reviewsGained, setReviewsGained] = useState<number | null>(null);
  // Editable message state
  const [customMessage, setCustomMessage] = useState(DEFAULT_MESSAGE);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  // Olera review count (for providers without Google)
  const [oleraReviewCount, setOleraReviewCount] = useState<number | null>(null);
  const [isLoadingOleraCount, setIsLoadingOleraCount] = useState(false);

  // Fetch this week's review request count on mount
  useEffect(() => {
    async function fetchThisWeekCount() {
      try {
        const res = await fetch("/api/review-requests");
        if (res.ok) {
          const data = await res.json();
          const requests = data.requests || [];
          // Count requests from this week
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const thisWeek = requests.filter((r: { sentAt: string }) => new Date(r.sentAt) > weekAgo);
          setThisWeekCount(thisWeek.length);
        }
      } catch {
        // Ignore errors, just don't show the count
      }
    }
    fetchThisWeekCount();
  }, []); // Only on mount - we optimistically update the counter on send

  // Fetch Olera review count for providers without Google
  useEffect(() => {
    if (hasGooglePlaceId || !providerSlug) return;

    let cancelled = false;
    setIsLoadingOleraCount(true);

    async function fetchOleraReviewCount() {
      try {
        const res = await fetch(`/api/provider/${providerSlug}/olera-reviews`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const reviews = data.reviews || [];
          setOleraReviewCount(reviews.length);
        }
      } catch {
        // Ignore errors, just don't show the count
      } finally {
        if (!cancelled) setIsLoadingOleraCount(false);
      }
    }
    fetchOleraReviewCount();

    return () => { cancelled = true; };
  }, [hasGooglePlaceId, providerSlug]);

  // Detect if provider gained reviews since last visit
  useEffect(() => {
    // Use Google count if available, otherwise Olera count
    const currentCount = providerReviewCount ?? oleraReviewCount;
    if (!providerSlug || currentCount === null) return;

    let dismissTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      // Use different storage keys for Google vs Olera to avoid conflicts
      const storageKey = providerReviewCount !== null
        ? `olera_reviews_google_${providerSlug}`
        : `olera_reviews_olera_${providerSlug}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const previousCount = parseInt(stored, 10);
        if (currentCount > previousCount) {
          setReviewsGained(currentCount - previousCount);
          // Auto-dismiss after 5 seconds
          dismissTimer = setTimeout(() => setReviewsGained(null), 5000);
        }
      }

      // Update stored count
      localStorage.setItem(storageKey, currentCount.toString());
    } catch {
      // localStorage unavailable (Safari private mode, etc.) - skip silently
    }

    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [providerSlug, providerReviewCount, oleraReviewCount]);

  // Auto-dismiss inline success indicator after 3 seconds
  useEffect(() => {
    if (justSent) {
      const timer = setTimeout(() => setJustSent(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !contactInfo.trim() || isSubmitting) return;

    // Validate email
    if (!isValidEmail(contactInfo.trim())) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients: [{
            name: clientName.trim(),
            email: contactInfo.trim(),
          }],
          message: customMessage,
          delivery_method: "email",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      const failedResults = data.results?.filter((r: { status: string }) => r.status === "failed") || [];
      if (failedResults.length > 0) {
        throw new Error(failedResults[0]?.error || "Failed to send email");
      }

      // Optimistically increment counter and show inline success
      setThisWeekCount((prev) => (prev ?? 0) + 1);
      setJustSent(true);
      setClientName("");
      setContactInfo("");
      setShowPreview(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effective review count: Google reviews take precedence, fall back to Olera reviews
  const effectiveReviewCount = providerReviewCount ?? oleraReviewCount;
  const currentReviews = effectiveReviewCount ?? 0;
  const isLoading = isLoadingOleraCount && !hasGooglePlaceId;

  // Build the competitive context subtitle
  let subtitle = "";
  if (isLoading) {
    subtitle = "Checking your reviews...";
  } else if (reviewsContext?.isFirst) {
    // Provider is #1
    subtitle = `You have ${currentReviews} reviews. You lead ${city || "your market"}.`;
  } else if (topCompetitor && topCompetitor.reviews > 0) {
    // Show competitive context
    const reviewWord = currentReviews === 1 ? "review" : "reviews";
    subtitle = `You have ${currentReviews} ${reviewWord}. The top provider in ${city || "your market"} has ${topCompetitor.reviews}.`;
  } else {
    // No competitor data - just show their count
    const reviewWord = currentReviews === 1 ? "review" : "reviews";
    subtitle = currentReviews === 0
      ? "You have no reviews yet."
      : `You have ${currentReviews} ${reviewWord}.`;
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8">
      {/* Celebration banner - shows when reviews gained since last visit */}
      {reviewsGained !== null && (
        <div className="mb-5 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl shadow-sm shadow-emerald-100">
          <span className="text-lg animate-bounce" style={{ animationDuration: "1s" }}>🎉</span>
          <span className="text-sm font-semibold text-emerald-700">
            You gained {reviewsGained} review{reviewsGained === 1 ? "" : "s"}!
          </span>
          <button
            type="button"
            onClick={() => setReviewsGained(null)}
            className="ml-1 text-emerald-400 hover:text-emerald-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Label */}
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider text-center mb-3">
        Your move this week
      </p>

      {/* Headline - direct call to action */}
      <h2 className="font-display text-2xl sm:text-[1.75rem] leading-tight text-stone-900 text-center mb-2">
        Ask a happy client for a review.
      </h2>

      {/* Subtitle - competitive context */}
      <p className="text-sm text-stone-500 text-center mb-6">
        {subtitle}
      </p>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm mb-5">
          <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Input fields - side by side on desktop, stacked on mobile */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name"
            required
            autoComplete="off"
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#199087]/20 focus:border-[#199087] transition-all duration-200"
          />
          <input
            type="email"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Email"
            required
            autoComplete="off"
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#199087]/20 focus:border-[#199087] transition-all duration-200"
          />
        </div>
        {/* Full-width button below inputs */}
        <button
          type="submit"
          disabled={!clientName.trim() || !isValidEmail(contactInfo.trim()) || !customMessage.trim() || isSubmitting}
          className="w-full mt-3 px-6 py-3 rounded-xl bg-[#199087] text-white text-[15px] font-medium hover:bg-[#147a72] disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_12px_rgba(25,144,135,0.35)] disabled:shadow-none"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            "Send request"
          )}
        </button>
      </form>

      {/* Preview toggle - only show for email input */}
      {isValidEmail(contactInfo.trim()) && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showPreview ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
            Preview the message
          </button>
        </div>
      )}

      {/* Email preview - matches actual email structure */}
      {showPreview && isValidEmail(contactInfo.trim()) && (
        <div className="mt-4 p-4 bg-stone-50 rounded-xl text-left">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-400 uppercase tracking-wider">What they&apos;ll receive</p>
            {!isEditingMessage && (
              <button
                type="button"
                onClick={() => setIsEditingMessage(true)}
                className="text-xs text-[#199087] hover:text-[#147a72] font-medium transition-colors"
              >
                Edit message
              </button>
            )}
          </div>
          <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-sm">
            {/* Email headline */}
            <p className="text-base font-semibold text-stone-900 mb-3">
              {providerName || "Your provider"} would love your feedback
            </p>
            {/* Greeting */}
            <p className="text-sm text-stone-700 mb-3">
              Hi <span className="font-medium">{clientName.trim() || "Client"}</span>,
            </p>
            {/* Message - editable or static */}
            {isEditingMessage ? (
              <div className="mb-4">
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#199087]/20 focus:border-[#199087] resize-none"
                  placeholder="Write your personalized message..."
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMessage(DEFAULT_MESSAGE);
                      setIsEditingMessage(false);
                    }}
                    className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingMessage(false)}
                    className="text-xs text-[#199087] hover:text-[#147a72] font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-l-2 border-[#199087] pl-3 py-1 mb-3">
                <p className="text-sm text-stone-600">{customMessage}</p>
              </div>
            )}
            {/* Additional text from email template */}
            <p className="text-sm text-stone-500 mb-4">
              Sharing your experience helps other families find quality care — and only takes a couple of minutes.
            </p>
            {/* Button preview */}
            <div className="inline-block px-4 py-2 bg-[#199087] text-white text-sm font-medium rounded-lg">
              Write a review
            </div>
            {/* Footer note */}
            <p className="text-[11px] text-stone-400 mt-4 pt-3 border-t border-stone-100">
              This email was sent on behalf of {providerName || "your provider"} via Olera.
            </p>
          </div>
        </div>
      )}

      {/* Footer - stacked: momentum counter, then Google status */}
      <div className="mt-6 space-y-3">
        {/* Momentum counter - plain text on its own line */}
        {((thisWeekCount !== null && thisWeekCount > 0) || justSent) && (
          <p
            className={`text-center text-xs transition-all duration-300 ${
              justSent ? "text-emerald-600" : "text-stone-400"
            }`}
          >
            {justSent ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="font-medium">Sent! {thisWeekCount} this week</span>
              </span>
            ) : (
              <span>{thisWeekCount} sent this week</span>
            )}
          </p>
        )}

        {/* Google status - last thing */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
            {hasGooglePlaceId ? (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Goes to Google</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#9CA3AF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#9CA3AF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#9CA3AF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#9CA3AF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <Link
                  href="/account/settings"
                  className="text-[#199087] hover:text-[#147a72] font-medium transition-colors"
                >
                  Connect Google
                </Link>
                <div className="relative group">
                  <svg className="w-3.5 h-3.5 text-stone-300 cursor-help" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-stone-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                    <p className="leading-relaxed">
                      Without Google connected, reviews are collected on Olera. Connect your Google Business Profile to get reviews directly on Google.
                    </p>
                    <div className="absolute top-full right-3 border-4 border-transparent border-t-stone-900" />
                  </div>
                </div>
              </>
            )}
          </div>
      </div>
    </div>
  );
}
