"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Star } from "@phosphor-icons/react";
import Link from "next/link";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import type { SimilarProviderForMulti } from "@/lib/provider-utils";

interface CurrentProviderData {
  id: string;
  slug: string;
  name: string;
  image?: string;
  priceRange?: string;
  rating?: number;
  city?: string;
  state?: string;
}

interface MultiProviderCardProps {
  question: string;
  currentProvider: CurrentProviderData;
  similarProviders: SimilarProviderForMulti[];
  onProviderSelect: (providerId: string, providerName: string) => Promise<void>;
  onEmailSubmit: (email: string, sentProviderIds: string[], sentCount: number) => Promise<void>;
  onSaveAll: (providerIds: string[]) => void;
  onCollapse: () => void;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  /** True when the initial question to current provider was sent */
  questionSent?: boolean;
  /** If provided, user is logged in — skip email capture and show confirmation */
  userEmail?: string;
}

type CardState = "card_stack" | "email_capture" | "success";

export default function MultiProviderCard({
  question,
  currentProvider,
  similarProviders,
  onProviderSelect,
  onEmailSubmit,
  onSaveAll,
  onCollapse,
  // isSubmitting: managed internally, parent prop ignored
  isSuccess: externalSuccess = false,
  // questionSent: not used in card stack flow
  userEmail,
}: MultiProviderCardProps) {
  const isLoggedIn = Boolean(userEmail);

  // If there are no similar providers, skip directly to email capture
  // (the user already sent a question to the current provider)
  const initialState: CardState = similarProviders.length === 0 ? "email_capture" : "card_stack";

  // State machine
  const [cardState, setCardState] = useState<CardState>(initialState);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [askedProviders, setAskedProviders] = useState<SimilarProviderForMulti[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"left" | "right" | null>(null);
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const expandTrackedRef = useRef(false);
  const engagedTrackedRef = useRef(false);

  // Derived state
  const currentCard = similarProviders[currentIndex];
  const isLastCard = currentIndex >= similarProviders.length - 1;
  const totalAsked = 1 + askedProviders.length; // 1 = original provider

  // Extract first name from provider name
  const getFirstName = (name: string) => {
    const cleanName = name?.replace(/^\([^)]+\)\s*/, "") || "";
    const rawFirstName = cleanName.split(/\s/)[0] || name?.split(/\s/)[0] || "them";
    return rawFirstName.replace(/'s$/i, "") || rawFirstName;
  };

  const firstName = getFirstName(currentProvider.name);

  // Handle image load errors
  const handleImageError = (providerId: string) => {
    setFailedImages((prev) => new Set([...prev, providerId]));
  };

  // Track analytics helper
  const trackActivity = (eventType: string, metadata: Record<string, unknown>) => {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: eventType,
        related_provider_id: currentProvider.id,
        session_id: getOrCreateSessionId(),
        metadata: { ...metadata, variant: "multi_provider" },
      }),
      keepalive: true,
    }).catch(() => {});
  };

  // Track engagement on first card interaction (ask or skip)
  const trackEngagementOnce = () => {
    if (engagedTrackedRef.current) return;
    engagedTrackedRef.current = true;
    trackActivity("multi_provider_engaged", {
      question_text: question,
      similar_count: similarProviders.length,
    });
  };

  // Mount animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to ensure card content is visible on mount
  useEffect(() => {
    if (mounted && cardRef.current) {
      const scrollTimer = setTimeout(() => {
        const card = cardRef.current;
        if (!card) return;

        // Get card position relative to viewport
        const cardRect = card.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // We want the card to be visible with some padding from top
        // Account for sticky headers (~60px) and breathing room (~20px)
        const desiredTopOffset = 80;

        // If card top is above the desired position or card is cut off at bottom
        const cardTop = cardRect.top;
        const cardBottom = cardRect.bottom;
        const stickyBottomCTA = 80; // approximate height of sticky bottom CTA

        // Calculate if we need to scroll
        if (cardTop < desiredTopOffset || cardBottom > viewportHeight - stickyBottomCTA) {
          // Scroll so the card starts at desiredTopOffset from viewport top
          const scrollY = window.scrollY + cardTop - desiredTopOffset;
          window.scrollTo({ top: scrollY, behavior: "smooth" });
        }
      }, 150); // slightly longer delay to ensure layout is settled
      return () => clearTimeout(scrollTimer);
    }
  }, [mounted]);

  // Track expansion
  useEffect(() => {
    if (expandTrackedRef.current) return;
    expandTrackedRef.current = true;
    trackActivity("multi_provider_card_shown", {
      question_text: question,
      similar_count: similarProviders.length,
    });
  }, []);

  // Auto-focus input on email capture state (desktop only)
  useEffect(() => {
    if (cardState === "email_capture" && inputRef.current && !isLoggedIn) {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (isDesktop) {
        const focusTimer = setTimeout(() => inputRef.current?.focus(), 300);
        return () => clearTimeout(focusTimer);
      }
    }
  }, [cardState, isLoggedIn]);

  // Handle external success (from parent component)
  useEffect(() => {
    if (externalSuccess && cardState !== "success") {
      setCardState("success");
    }
  }, [externalSuccess, cardState]);

  // Auto-collapse after success state OR for logged-in users in email_capture
  useEffect(() => {
    // Guest users: collapse after success state
    // Logged-in users: collapse after email_capture (they see confirmation there)
    const shouldCollapse =
      cardState === "success" || (cardState === "email_capture" && isLoggedIn);

    if (shouldCollapse) {
      const timer = setTimeout(() => onCollapse(), 15000);
      return () => clearTimeout(timer);
    }
  }, [cardState, isLoggedIn, onCollapse]);

  // Track flow completion for logged-in users (engagement metric, NOT conversion)
  // Conversions only count when a guest user submits their email and creates an account
  const loggedInFlowTrackedRef = useRef(false);
  useEffect(() => {
    if (cardState === "email_capture" && isLoggedIn && !loggedInFlowTrackedRef.current) {
      loggedInFlowTrackedRef.current = true;
      const allSentProviderIds = [currentProvider.id, ...askedProviders.map((p) => p.id)];
      trackActivity("multi_provider_flow_completed", {
        sent_count: allSentProviderIds.length,
        provider_ids: allSentProviderIds,
        logged_in: true,
      });
    }
  }, [cardState, isLoggedIn, currentProvider.id, askedProviders]);

  // Note: QASectionV2 now guards against empty similarProviders by not rendering
  // this component when there are no similar providers to show.

  const handleSkip = () => {
    if (isAnimating || !currentCard) return;
    trackEngagementOnce(); // Track first card interaction
    setIsAnimating(true);
    setAnimationDirection("left");

    trackActivity("multi_provider_skipped", {
      provider_id: currentCard.id,
      position: currentIndex,
    });

    setTimeout(() => {
      if (isLastCard || currentIndex >= similarProviders.length - 1) {
        setCardState("email_capture");
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
      setAnimationDirection(null);
      setIsAnimating(false);
    }, 300);
  };

  const handleAsk = async () => {
    if (isAnimating || isSendingQuestion || !currentCard) return;
    trackEngagementOnce(); // Track first card interaction
    setSendError(null);
    setIsSendingQuestion(true);

    try {
      // Send question immediately (existing API)
      await onProviderSelect(currentCard.id, currentCard.name);

      // Success - add to asked list and animate away
      setAskedProviders((prev) => [...prev, currentCard]);

      trackActivity("multi_provider_asked", {
        provider_id: currentCard.id,
        position: currentIndex,
        sent_count: askedProviders.length + 2, // current + this + original
      });

      // Animate card away
      setIsAnimating(true);
      setAnimationDirection("right");

      setTimeout(() => {
        if (isLastCard || currentIndex >= similarProviders.length - 1) {
          setCardState("email_capture");
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
        setAnimationDirection(null);
        setIsAnimating(false);
        setIsSendingQuestion(false);
      }, 300);
    } catch {
      // On failure, show error and let user retry or skip
      setSendError("Failed to send. Tap to retry or skip.");
      setIsSendingQuestion(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setEmailError(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    const allSentProviderIds = [currentProvider.id, ...askedProviders.map((p) => p.id)];

    try {
      await onEmailSubmit(email.trim().toLowerCase(), allSentProviderIds, allSentProviderIds.length);
      // Note: Analytics tracking happens in QASectionV2's handleMultiProviderEmailSubmit
      setCardState("success");
    } catch (err) {
      // API returns user-friendly error messages, just display them
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setEmailError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleEmailSubmit();
    }
  };

  const handleSaveAll = () => {
    const allSentIds = [currentProvider.id, ...askedProviders.map((p) => p.id)];
    onSaveAll(allSentIds);
    trackActivity("multi_provider_save_all", {
      saved_count: allSentIds.length,
      provider_ids: allSentIds,
    });
  };

  // Build provider avatar component
  const ProviderAvatar = ({
    provider,
    size = "md",
    className = "",
    style,
  }: {
    provider: { id: string; name: string; image?: string | null };
    size?: "sm" | "md" | "lg";
    className?: string;
    style?: React.CSSProperties;
  }) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    };

    if (provider.image && !failedImages.has(provider.id)) {
      return (
        <img
          src={provider.image}
          alt={provider.name}
          onError={() => handleImageError(provider.id)}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
          style={style}
        />
      );
    }
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-2 ring-white shadow-sm ${className}`}
        style={style}
      >
        <span className="font-semibold text-primary-700">{provider.name.charAt(0)}</span>
      </div>
    );
  };

  // Truncate question for display
  const truncateQuestion = (q: string, maxLength: number = 40) => {
    if (q.length <= maxLength) return q;
    return q.slice(0, maxLength).trim() + "…";
  };

  // Browse URL for success state - pre-fill location search
  const city = currentProvider.city || "";
  const browseUrl = city ? `/browse?location=${encodeURIComponent(city)}` : `/browse`;

  // All providers who were sent questions (for email capture and success states)
  const allSentProviders = [
    {
      id: currentProvider.id,
      name: currentProvider.name,
      image: currentProvider.image || null,
    },
    ...askedProviders.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
    })),
  ];

  return (
    <div
      ref={cardRef}
      className={`
        bg-transparent
        overflow-hidden
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      {/* ═══════════════════════════════════════════════════════════════
          STATE 1: CARD STACK — Swipe through similar providers
          ═══════════════════════════════════════════════════════════════ */}
      {cardState === "card_stack" && similarProviders.length > 0 && (
        <div className="p-4 lg:p-6">
          {/* Stack 1: Context pill + Headline */}
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100">
              <span className="text-sm font-semibold italic text-gray-600">
                You asked {(() => {
                  const words = currentProvider.name.split(/\s+/);
                  if (words.length <= 1) return currentProvider.name;
                  return `${words[0]} ${words[1].charAt(0)}.`;
                })()} a question.
              </span>
            </span>
          </div>

          <div className="mb-8 text-center">
            <h3 className="font-display text-2xl font-normal text-gray-900 leading-tight">
              Others might answer differently.
            </h3>
          </div>

          {/* Stack 2: Card Stack (standalone) */}
          <div className="relative mb-8 mx-2 lg:mx-20">
            {/* Peek card 2 (furthest back) - rotated left */}
            {currentIndex < similarProviders.length - 2 && (
              <div
                className="absolute inset-x-0 top-0 h-24 rounded-2xl bg-white border border-gray-300"
                style={{
                  transform: "translateY(-12px) scale(0.92) rotate(-3deg)",
                  opacity: 0.5,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                }}
              />
            )}
            {/* Peek card 1 (middle) - rotated right */}
            {currentIndex < similarProviders.length - 1 && (
              <div
                className="absolute inset-x-0 top-0 h-24 rounded-2xl bg-white border border-gray-300"
                style={{
                  transform: "translateY(-6px) scale(0.96) rotate(2deg)",
                  opacity: 0.8,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                }}
              />
            )}

            {/* Active Card */}
            {currentCard && (
              <div
                className={`
                  relative bg-white rounded-2xl border border-gray-300 p-5
                  transition-transform duration-300
                  ${animationDirection === "left" ? "animate-swipe-left" : ""}
                  ${animationDirection === "right" ? "animate-swipe-right" : ""}
                  ${!animationDirection && currentIndex > 0 ? "animate-card-rise" : ""}
                `}
                style={{
                  boxShadow: "0 12px 32px -4px rgba(0,0,0,0.15), 0 4px 12px -2px rgba(0,0,0,0.08)",
                }}
              >
                {/* Provider header */}
                <div className="flex items-start gap-3 mb-4">
                  <ProviderAvatar provider={currentCard} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[17px] font-semibold text-gray-900 truncate">
                      {currentCard.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {currentCard.city}
                      {currentCard.state ? `, ${currentCard.state}` : ""}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-3 mb-5">
                  {currentCard.rating && (
                    <div className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                        Rating
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} weight="fill" className="text-amber-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {currentCard.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                  {currentCard.priceRange && (
                    <div className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                        {currentCard.priceRange.includes("/hr") ? "Hourly Rate" : "Monthly Rate"}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {currentCard.priceRange.replace(/\/(hr|mo)$/, '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSendError(null);
                      handleSkip();
                    }}
                    disabled={isAnimating || isSendingQuestion}
                    className="
                      flex-shrink-0 px-5 py-3
                      text-[15px] font-medium text-gray-700
                      bg-white border-2 border-gray-300 rounded-full
                      hover:border-gray-400 hover:bg-gray-50
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleAsk}
                    disabled={isAnimating || isSendingQuestion}
                    className="
                      flex-1 px-5 py-3
                      text-[15px] font-semibold text-white
                      bg-gray-900 rounded-full
                      hover:bg-gray-800
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isSendingQuestion ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Ask them too"
                    )}
                  </button>
                </div>

                {/* Error message */}
                {sendError && (
                  <p className="mt-3 text-sm text-red-600 text-center font-medium">
                    {sendError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stack 3: Progress tracker */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">
                Question sent to · {totalAsked} provider{totalAsked !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex -space-x-2">
              <ProviderAvatar
                provider={currentProvider}
                size="sm"
                className="animate-tracker-pop"
              />
              {askedProviders.map((p, idx) => (
                <ProviderAvatar
                  key={p.id}
                  provider={p}
                  size="sm"
                  className="animate-tracker-pop"
                  style={{ animationDelay: `${(idx + 1) * 100}ms` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STATE 2: EMAIL CAPTURE — Collect email after all cards processed
          ═══════════════════════════════════════════════════════════════ */}
      {cardState === "email_capture" && (
        <div className="p-4 lg:p-6">
          {isLoggedIn ? (
            /* Logged-in user: show confirmation */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-100 mb-4">
                <Check size={28} weight="bold" className="text-success-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                {totalAsked === 1 ? "Question sent!" : `${totalAsked} questions sent!`}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ll email <span className="font-medium">{userEmail}</span> as they respond.
              </p>
              <button
                type="button"
                onClick={handleSaveAll}
                className="
                  inline-flex items-center gap-2 px-4 py-2.5
                  text-sm font-medium text-gray-700
                  bg-white rounded-xl border border-gray-200
                  hover:bg-gray-50 hover:border-gray-300
                  transition-all duration-200
                "
              >
                Save all {totalAsked} providers
              </button>
            </div>
          ) : (
            /* Guest user: email capture form */
            <>
              {/* Header with reply count */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  {totalAsked} {totalAsked === 1 ? "reply" : "replies"} on the way
                </span>
              </div>

              {/* Provider list with "Replying" animation */}
              <div className="space-y-2 mb-8 mx-2 lg:mx-[100px]">
                {allSentProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-50 min-w-0"
                  >
                    <ProviderAvatar provider={provider} size="sm" className="shrink-0" />
                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 truncate">
                      {provider.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 shrink-0 ml-3">
                      <span className="italic">Replying</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-amber-600 typing-dot-1" />
                        <span className="w-1 h-1 rounded-full bg-amber-600 typing-dot-2" />
                        <span className="w-1 h-1 rounded-full bg-amber-600 typing-dot-3" />
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Headline */}
              <h3 className="font-display text-2xl font-normal text-gray-900 text-center mb-2">
                Don&apos;t miss what they say.
              </h3>

              {/* Email form - inset button pattern */}
              <div
                className={`
                  flex items-center gap-2 p-1.5
                  bg-white border rounded-full
                  transition-all duration-200
                  focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-900
                  ${emailError ? "border-red-300 ring-2 ring-red-50" : "border-gray-300"}
                `}
              >
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="yourname@email.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="
                    flex-1 min-w-0 px-4 py-2
                    text-sm text-gray-900 placeholder-gray-500
                    bg-transparent border-none outline-none
                    disabled:opacity-50
                  "
                />
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  disabled={isSubmitting || !email.trim()}
                  className="
                    shrink-0 px-5 py-2.5
                    text-sm font-semibold text-white
                    bg-gray-900 rounded-full
                    hover:bg-gray-800
                    transition-all duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    totalAsked === 1 ? "Send reply" : "Send replies"
                  )}
                </button>
              </div>

              {/* Error message */}
              {emailError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{emailError}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STATE 3: SUCCESS — Confirmation after email submitted
          ═══════════════════════════════════════════════════════════════ */}
      {cardState === "success" && (
        <div className="p-6 text-center">
          {/* Success checkmark */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 mb-4 animate-success-pop">
            <Check size={28} weight="bold" className="text-white" />
          </div>

          {/* Headline */}
          <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">
            We&apos;ve got it from here.
          </h3>

          {/* Confirmation text */}
          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            We&apos;ll send replies to{" "}
            <span className="font-semibold text-gray-900">{userEmail || email}</span> as they come
            in — usually within a day.
          </p>

          {/* Overlapping avatars */}
          <div className="flex justify-center -space-x-3 mb-5">
            {allSentProviders.slice(0, 4).map((provider, idx) => (
              <ProviderAvatar
                key={provider.id}
                provider={provider}
                size="md"
                className="ring-4 ring-white"
                style={{ zIndex: allSentProviders.length - idx } as React.CSSProperties}
              />
            ))}
            {allSentProviders.length > 4 && (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-white text-xs font-semibold text-gray-500">
                +{allSentProviders.length - 4}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCollapse}
              className="
                px-5 py-2.5
                text-sm font-medium text-gray-500
                hover:text-gray-700
                transition-all duration-200
              "
            >
              Not now
            </button>
            <Link href={browseUrl}>
              <button
                type="button"
                className="
                  inline-flex items-center justify-center px-6 py-2.5
                  text-sm font-medium text-gray-700
                  bg-white border border-gray-200 rounded-full
                  hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700
                  transition-all duration-200
                "
              >
Find More Options
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
