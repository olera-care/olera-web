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

interface ReviewsTabProps {
  reviewsContext: ReviewsContext | null;
  providerSlug?: string;
  hasGooglePlaceId: boolean;
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

  const [dividerLinkCopied, setDividerLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!providerSlug) return;
    const reviewLink = `${window.location.origin}/review/${providerSlug}`;

    try {
      await navigator.clipboard.writeText(reviewLink);
      setDividerLinkCopied(true);
      setTimeout(() => setDividerLinkCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = reviewLink;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setDividerLinkCopied(true);
      setTimeout(() => setDividerLinkCopied(false), 2000);
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

  // Determine headline based on context
  let headline = "Get more reviews";
  let subline = "Each happy client you add helps families find you.";

  if (reviewsContext) {
    if (reviewsContext.isFirst) {
      headline = "You're #1 in your market.";
      subline = "Keep building your lead with more reviews.";
    } else if (reviewsContext.reviewsNeeded && reviewsContext.targetRank) {
      headline = `${reviewsContext.reviewsNeeded} review${reviewsContext.reviewsNeeded === 1 ? "" : "s"} from #${reviewsContext.targetRank}.`;
      subline = reviewsContext.nextCompetitor
        ? `Each happy client you add climbs you toward ${reviewsContext.nextCompetitor}.`
        : "Each happy client you add improves your ranking.";
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8">
      {/* Header */}
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider text-center mb-2">
        Your move this week
      </p>
      <h2 className="font-display text-2xl sm:text-[1.75rem] leading-tight text-stone-900 text-center mb-2">
        {headline}
      </h2>
      <p className="text-sm text-stone-500 text-center mb-6">
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

      {/* Divider with "or" */}
      <div className="flex items-center justify-center gap-3 my-6">
        <div className="w-8 h-px bg-stone-200" />
        <button
          type="button"
          onClick={handleCopyLink}
          className={`text-sm font-medium transition-colors ${
            dividerLinkCopied
              ? "text-emerald-600"
              : "text-[#199087] hover:text-[#147a72]"
          }`}
        >
          {dividerLinkCopied ? "Link copied ✓" : "or copy a link to share yourself"}
        </button>
        <div className="w-8 h-px bg-stone-200" />
      </div>

      {/* Preview link */}
      {providerSlug && (
        <div className="text-center">
          <Link
            href={`/review/${providerSlug}`}
            target="_blank"
            className="text-sm text-stone-500 hover:text-stone-700 font-medium transition-colors inline-flex items-center gap-1"
          >
            Preview the message
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
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
              <svg className="w-3.5 h-3.5 text-stone-300" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Reviews go to your Olera profile
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
