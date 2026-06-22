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

interface Leader {
  name: string;
  reviews: number;
  rating: number | null;
}

interface ReviewsTabProps {
  reviewsContext: ReviewsContext | null;
  providerSlug?: string;
  hasGooglePlaceId: boolean;
  city?: string;
  topCompetitor?: Leader | null;
  leaders?: Leader[];
  providerReviewCount: number | null;
}

const DEFAULT_MESSAGE = "Hi, we'd love to hear about your experience with us. Would you take a moment to leave a review? It helps other families find quality care.";

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
  hasGooglePlaceId,
  city,
  topCompetitor,
  leaders = [],
  providerReviewCount,
}: ReviewsTabProps) {
  // Form state
  const [clientName, setClientName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<"email" | "link">("email");
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [thisWeekCount, setThisWeekCount] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch this week's review request count
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
  }, [showSuccess]); // Refetch after successful submission

  // Auto-dismiss success after 4 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !contactInfo.trim() || isSubmitting) return;

    const isEmail = isValidEmail(contactInfo.trim());

    // For non-email (phone), we'll generate a link for manual sharing
    if (!isEmail) {
      // Generate link and show it for manual sharing
      const reviewLink = providerSlug
        ? `${window.location.origin}/review/${providerSlug}?name=${encodeURIComponent(clientName.trim())}`
        : null;

      if (!reviewLink) {
        setErrorMessage("Unable to generate review link");
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        // Log the link share for tracking
        const res = await fetch("/api/review-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clients: [{ name: clientName.trim(), email: null }],
            message: null,
            delivery_method: "link",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create request");
        }

        setSuccessType("link");
        setSuccessLink(reviewLink);
        setLinkCopied(false);
        setShowSuccess(true);
        setClientName("");
        setContactInfo("");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Email flow
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
          message: DEFAULT_MESSAGE,
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

      setSuccessType("email");
      setSuccessLink(null);
      setShowSuccess(true);
      setClientName("");
      setContactInfo("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle copy from success state
  const handleCopySuccessLink = async () => {
    if (!successLink) return;

    try {
      await navigator.clipboard.writeText(successLink);
      setLinkCopied(true);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = successLink;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(true);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          {successType === "email" ? "Request sent!" : "Link ready!"}
        </h3>
        <p className="text-sm text-stone-500 mb-5">
          {successType === "email"
            ? "They'll receive your review request shortly."
            : "Share this link via text, WhatsApp, or in person."}
        </p>

        {/* Show copyable link for link success type */}
        {successType === "link" && successLink && (
          <div className="mb-5">
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input
                type="text"
                readOnly
                value={successLink}
                className="flex-1 px-3 py-2 text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-lg truncate"
              />
              <button
                type="button"
                onClick={handleCopySuccessLink}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                  linkCopied
                    ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
                    : "text-[#199087] bg-[#199087]/10 border border-[#199087]/20 hover:bg-[#199087]/20"
                }`}
              >
                {linkCopied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setShowSuccess(false);
            setSuccessLink(null);
            setLinkCopied(false);
          }}
          className="text-sm text-[#199087] hover:text-[#147a72] font-medium transition-colors"
        >
          Send another request
        </button>
      </div>
    );
  }

  // Calculate top 10 threshold (minimum reviews to be in top 10)
  const top10Threshold = leaders.length > 0
    ? leaders[Math.min(leaders.length - 1, 9)]?.reviews ?? 0
    : null;

  // Find the next competitor to beat based on provider's current reviews
  const findNextTarget = () => {
    if (providerReviewCount === null || leaders.length === 0) return null;
    // Find the lowest-ranked leader the provider can realistically pass
    const sortedByReviews = [...leaders].sort((a, b) => a.reviews - b.reviews);
    const nextTarget = sortedByReviews.find(l => l.reviews > providerReviewCount);
    if (!nextTarget) return null;
    return {
      name: nextTarget.name,
      reviews: nextTarget.reviews,
      needed: nextTarget.reviews - providerReviewCount + 1,
    };
  };

  // Determine headline based on context - ALWAYS show competitive framing
  let headline = "";
  let subline = "";

  if (reviewsContext) {
    // Provider is ranked in the market (has Place ID match)
    if (reviewsContext.isFirst) {
      headline = "You're #1 in your market.";
      subline = "Keep building your lead with more reviews.";
    } else if (reviewsContext.reviewsNeeded && reviewsContext.targetRank) {
      headline = `${reviewsContext.reviewsNeeded} review${reviewsContext.reviewsNeeded === 1 ? "" : "s"} from #${reviewsContext.targetRank}.`;
      subline = reviewsContext.nextCompetitor
        ? `Beat ${reviewsContext.nextCompetitor} to climb the ladder.`
        : "Each review moves you up the ranking.";
    }
  } else if (providerReviewCount !== null && leaders.length > 0) {
    // Provider has review count but not ranked - show dynamic goal
    const nextTarget = findNextTarget();

    if (providerReviewCount === 0) {
      // No reviews yet
      headline = top10Threshold !== null
        ? `Top 10 in ${city || "your market"} have ${top10Threshold}+ reviews.`
        : "Families are choosing providers with more reviews.";
      subline = "Send your first request to start competing.";
    } else if (nextTarget) {
      // Has some reviews, show next target
      headline = `You have ${providerReviewCount} review${providerReviewCount === 1 ? "" : "s"}. Just ${nextTarget.needed} more to pass ${nextTarget.name}.`;
      subline = "Each happy client moves you up.";
    } else if (top10Threshold !== null && providerReviewCount >= top10Threshold) {
      // Already competitive
      headline = `You have ${providerReviewCount} reviews.`;
      subline = "You're competitive. Keep building your lead.";
    } else {
      headline = `You have ${providerReviewCount} review${providerReviewCount === 1 ? "" : "s"}.`;
      subline = top10Threshold !== null
        ? `${top10Threshold - providerReviewCount} more to crack the top 10.`
        : "Each review helps families find you.";
    }
  } else if (top10Threshold !== null) {
    // No review count, but we know the market threshold
    headline = `Top 10 in ${city || "your market"} have ${top10Threshold}+ reviews.`;
    subline = "Start building yours to compete.";
  } else if (topCompetitor) {
    // Fallback to top competitor
    headline = "Families are choosing providers with more reviews.";
    subline = `Each happy client you add climbs you toward ${topCompetitor.name}.`;
  } else {
    // Ultimate fallback
    headline = "Build your reputation";
    subline = "Reviews help families find and trust you.";
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8">
      {/* Label - separate from headline stack */}
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider text-center mb-5">
        Your move this week
      </p>

      {/* Headline + Subline - tight stack */}
      <h2 className="font-display text-2xl sm:text-[1.75rem] leading-tight text-stone-900 text-center mb-1">
        {headline}
      </h2>
      <p className="text-[15px] text-stone-500 text-center mb-8">
        {subline}
      </p>

      {/* Progress indicator (if not #1) */}
      {reviewsContext && !reviewsContext.isFirst && reviewsContext.reviewsNeeded && reviewsContext.targetRank && (
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-sm font-medium text-stone-500">#{reviewsContext.rank}</span>
          {Array.from({ length: Math.min(reviewsContext.reviewsNeeded, 4) }).map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center"
            >
              <span className="text-stone-400 text-lg">+</span>
            </div>
          ))}
          {reviewsContext.reviewsNeeded > 4 && (
            <span className="text-xs text-stone-400">+{reviewsContext.reviewsNeeded - 4} more</span>
          )}
          <span className="text-sm font-medium text-[#199087]">#{reviewsContext.targetRank}</span>
        </div>
      )}

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
        {/* Desktop: inputs + button inline */}
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
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Phone or email"
            required
            autoComplete="off"
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#199087]/20 focus:border-[#199087] transition-all duration-200"
          />
          {/* Desktop: compact icon button */}
          <button
            type="submit"
            disabled={!clientName.trim() || !contactInfo.trim() || isSubmitting}
            className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-xl bg-[#199087] text-white hover:bg-[#147a72] disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_12px_rgba(25,144,135,0.35)] disabled:shadow-none"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            )}
          </button>
        </div>
        {/* Mobile: full-width button below */}
        <button
          type="submit"
          disabled={!clientName.trim() || !contactInfo.trim() || isSubmitting}
          className="sm:hidden w-full mt-3 px-6 py-3 rounded-xl bg-[#199087] text-white text-[15px] font-medium hover:bg-[#147a72] disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_12px_rgba(25,144,135,0.35)] disabled:shadow-none"
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

      {/* Email preview */}
      {showPreview && isValidEmail(contactInfo.trim()) && (
        <div className="mt-4 p-4 bg-stone-50 rounded-xl text-left">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">What they&apos;ll receive</p>
          <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-sm">
            <p className="text-sm text-stone-700 mb-3">
              Hi <span className="font-medium">{clientName.trim() || "Client"}</span>,
            </p>
            <div className="border-l-2 border-[#199087] pl-3 py-1 mb-4">
              <p className="text-sm text-stone-600 italic">{DEFAULT_MESSAGE}</p>
            </div>
            <div className="inline-block px-4 py-2 bg-[#199087] text-white text-sm font-medium rounded-lg">
              Write a review
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-2">
        <p className="text-xs text-stone-400 text-center flex items-center justify-center gap-1.5 flex-wrap">
          {hasGooglePlaceId ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Goes straight to your Google page
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
              {/* Info icon with tooltip */}
              <div className="relative group">
                <svg className="w-3.5 h-3.5 text-stone-300 cursor-help" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-stone-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                  <p className="leading-relaxed">
                    Without Google connected, reviews are collected on Olera. Connect your Google Business Profile to get reviews directly on Google.
                  </p>
                  <div className="absolute top-full right-3 border-4 border-transparent border-t-stone-900" />
                </div>
              </div>
            </>
          )}
          {thisWeekCount !== null && thisWeekCount > 0 && (
            <>
              <span className="text-stone-300 mx-1">·</span>
              we send it and follow up
              <span className="text-stone-300 mx-1">·</span>
              <span className="font-medium text-stone-500">{thisWeekCount} this week</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
