"use client";

import { useState, useRef, useEffect } from "react";
import { Check, HourglassMedium, Heart } from "@phosphor-icons/react";
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
  onEmailSubmit: (email: string) => Promise<void>;
  onSaveAll: (providerIds: string[]) => void;
  onCollapse: () => void;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  /** True when the initial question to current provider was sent */
  questionSent?: boolean;
  /** If provided, user is logged in — skip email capture and show confirmation */
  userEmail?: string;
}

export default function MultiProviderCard({
  question,
  currentProvider,
  similarProviders,
  onProviderSelect,
  onEmailSubmit,
  onSaveAll,
  onCollapse,
  isSubmitting = false,
  isSuccess = false,
  questionSent = false,
  userEmail,
}: MultiProviderCardProps) {
  const isLoggedIn = Boolean(userEmail);

  // Track which OTHER providers have been sent (current provider is already sent)
  const [sentProviders, setSentProviders] = useState<Set<string>>(new Set());
  const [sendingProvider, setSendingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const expandTrackedRef = useRef(false);
  const collapseScheduledRef = useRef(false);

  // Extract first name from provider name
  const getFirstName = (name: string) => {
    const cleanName = name?.replace(/^\([^)]+\)\s*/, "") || "";
    const rawFirstName = cleanName.split(/\s/)[0] || name?.split(/\s/)[0] || "them";
    return rawFirstName.replace(/'s$/i, "") || rawFirstName;
  };

  const firstName = getFirstName(currentProvider.name);

  // Total sent = current provider (1) + other providers sent
  const totalSentCount = 1 + sentProviders.size;
  const otherProvidersSentCount = sentProviders.size;

  // Dynamic copy based on sent count
  const buttonText = totalSentCount === 1 ? "Get reply" : `Get ${totalSentCount} replies`;

  const finePrint =
    totalSentCount === 1
      ? `We'll email you as ${firstName} responds. No calls.`
      : "We'll email replies as they come in. No calls.";

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Scroll the card into view when it mounts
  useEffect(() => {
    if (mounted && cardRef.current) {
      const scrollTimer = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [mounted]);

  // Auto-focus input on desktop only
  useEffect(() => {
    if (mounted && inputRef.current && !showSuccess && !isLoggedIn) {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (isDesktop) {
        const focusTimer = setTimeout(() => {
          inputRef.current?.focus();
        }, 600);
        return () => clearTimeout(focusTimer);
      }
    }
  }, [mounted, showSuccess, isLoggedIn]);

  // Track expansion — deduplicated via ref
  useEffect(() => {
    if (expandTrackedRef.current) return;
    expandTrackedRef.current = true;
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "multi_provider_expanded",
        related_provider_id: currentProvider.id,
        session_id: getOrCreateSessionId(),
        metadata: {
          question_text: question,
          similar_count: similarProviders.length,
          variant: "multi_provider",
        },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [currentProvider.id, question, similarProviders.length]);

  // Auto-collapse after success
  useEffect(() => {
    if (isSuccess && !showSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        onCollapse();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, showSuccess, onCollapse]);

  // Auto-collapse for logged-in users after they've seen the confirmation
  useEffect(() => {
    if (isLoggedIn && mounted && questionSent && !collapseScheduledRef.current) {
      collapseScheduledRef.current = true;
      setTimeout(() => {
        onCollapse();
      }, 5000);
    }
  }, [isLoggedIn, mounted, questionSent, onCollapse]);

  const handleProviderClick = async (providerId: string, providerName: string) => {
    if (sentProviders.has(providerId) || sendingProvider) return;

    setSendingProvider(providerId);

    try {
      await onProviderSelect(providerId, providerName);
      setSentProviders((prev) => new Set([...prev, providerId]));

      // Track analytics
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          event_type: "multi_provider_question_sent",
          related_provider_id: providerId,
          session_id: getOrCreateSessionId(),
          metadata: {
            question_text: question,
            sent_count: sentProviders.size + 2, // current + this + previous others
            variant: "multi_provider",
          },
        }),
        keepalive: true,
      }).catch(() => {});
    } finally {
      setSendingProvider(null);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }
    try {
      await onEmailSubmit(email.trim().toLowerCase());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSaveAll = () => {
    // Include current provider + all sent similar providers
    const allSentIds = [currentProvider.id, ...Array.from(sentProviders)];
    onSaveAll(allSentIds);
    // Track analytics
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "multi_provider_save_all",
        related_provider_id: currentProvider.id,
        session_id: getOrCreateSessionId(),
        metadata: {
          saved_count: allSentIds.length,
          provider_ids: allSentIds,
          variant: "multi_provider",
        },
      }),
      keepalive: true,
    }).catch(() => {});
  };

  // Build sent provider list for success state (current + sent similar providers)
  const sentProvidersList = [
    {
      id: currentProvider.id,
      name: currentProvider.name,
      image: currentProvider.image || null,
      rating: currentProvider.rating || null,
      city: currentProvider.city || null,
    },
    ...similarProviders.filter((p) => sentProviders.has(p.id)),
  ];

  return (
    <div
      ref={cardRef}
      className={`
        bg-white rounded-2xl
        ring-1 ring-inset ring-primary-200 hover:ring-primary-300
        shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]
        overflow-hidden
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      {showSuccess ? (
        /* ═══════════════════════════════════════════════════════════════
           Success State — Multi-provider confirmation (Premium feel)
           ═══════════════════════════════════════════════════════════════ */
        <div className="p-6">
          {/* Celebratory Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-200 mb-3">
              <Check size={24} weight="bold" className="text-white" />
            </div>
            <h3 className="text-[19px] font-semibold text-gray-900">
              You&apos;ll get {totalSentCount} {totalSentCount === 1 ? "reply" : "replies"}
            </h3>
            <p className="text-[14px] text-gray-500 mt-1 leading-relaxed">
              We&apos;ll email <span className="font-medium text-gray-700">{userEmail || email}</span> as each provider responds.
              <br className="hidden sm:block" />
              Most reply within 24 hours.
            </p>
          </div>

          {/* Provider list with avatars featuring checkmark badges */}
          <div className="bg-gray-50/80 rounded-xl p-3 space-y-2">
            {sentProvidersList.map((provider, idx) => (
              <div
                key={provider.id}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white
                  border border-gray-100 shadow-sm
                  transition-all duration-300 ease-out
                  ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                `}
                style={{ transitionDelay: `${idx * 75}ms` }}
              >
                {/* Avatar with success checkmark badge */}
                <div className="relative shrink-0">
                  {provider.image ? (
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                      <span className="text-sm font-semibold text-primary-700">
                        {provider.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Checkmark badge overlay */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white shadow-sm">
                    <Check size={12} weight="bold" className="text-white" />
                  </div>
                </div>

                {/* Provider info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-gray-900 truncate">
                    {provider.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    {provider.rating && (
                      <>
                        <span className="text-amber-400">★</span>
                        <span>{provider.rating.toFixed(1)}</span>
                        <span className="text-gray-300">·</span>
                      </>
                    )}
                    {provider.city && <span>{provider.city}</span>}
                  </div>
                </div>

                {/* Awaiting status with animated hourglass */}
                <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 border border-amber-100">
                  <HourglassMedium size={14} weight="fill" className="text-amber-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Save all CTA — styled button */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleSaveAll}
              className="
                inline-flex items-center gap-2 px-4 py-2.5
                text-[14px] font-medium text-gray-700
                bg-white rounded-xl border border-gray-200
                shadow-sm hover:shadow hover:border-gray-300
                transition-all duration-200 ease-out
                active:scale-[0.98]
              "
            >
              <Heart size={16} weight="regular" className="text-gray-400" />
              Save all {totalSentCount} providers
            </button>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           Main Card — Question → Provider List → Email Capture
           ═══════════════════════════════════════════════════════════════ */
        <div className="p-6">
          {/* ─── Question ─────────────────────────────────────────────────── */}
          <div
            className={`
              transition-all duration-500 ease-out delay-75
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <p className="font-display italic text-[16px] text-gray-800 leading-relaxed">
              &ldquo;{question}&rdquo;
            </p>
          </div>

          {/* ─── Instruction ──────────────────────────────────────────────── */}
          <div
            className={`
              mt-3
              transition-all duration-500 ease-out delay-100
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <p className="text-[15px] text-gray-700 leading-relaxed">
              Tap to ask the same question to others — <span className="font-semibold text-gray-900">compare answers side by side.</span>
            </p>
          </div>

          {/* ─── Unified Provider List (current + similar) ────────────────── */}
          <div
            className={`
              mt-4 space-y-2
              transition-all duration-500 ease-out delay-150
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {/* Current provider — already sent */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-emerald-50/60 border-emerald-100"
            >
              {/* Checkbox — checked */}
              <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                <Check size={14} weight="bold" className="text-white" />
              </div>

              {/* Provider info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-gray-900 truncate">
                    {currentProvider.name}
                  </p>
                  <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-100 text-primary-700 uppercase tracking-wide">
                    This page
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5">
                  {currentProvider.rating && (
                    <>
                      <span className="text-amber-400">★</span>
                      <span className="font-medium">{currentProvider.rating.toFixed(1)}</span>
                      <span className="text-gray-300">·</span>
                    </>
                  )}
                  {currentProvider.city && <span>{currentProvider.city}</span>}
                  {currentProvider.priceRange && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="font-medium">{currentProvider.priceRange}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Sent status */}
              <span className="shrink-0 flex items-center gap-1.5 text-[13px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Sent
              </span>
            </div>

            {/* Similar providers — can tap to send */}
            {similarProviders.map((provider, idx) => {
              const isSent = sentProviders.has(provider.id);
              const isSending = sendingProvider === provider.id;

              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleProviderClick(provider.id, provider.name)}
                  disabled={isSent || isSending}
                  className={`
                    group w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border
                    transition-all duration-200 ease-out
                    ${isSent
                      ? "bg-emerald-50/60 border-emerald-100 cursor-default"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer active:scale-[0.995]"
                    }
                    ${isSending ? "opacity-80 scale-[0.99]" : ""}
                  `}
                >
                  {/* Checkbox */}
                  <div
                    className={`
                      w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-200
                      ${isSent
                        ? "bg-emerald-500 shadow-sm"
                        : "border-2 border-gray-300"
                      }
                    `}
                  >
                    {isSent && (
                      <Check size={14} weight="bold" className="text-white" />
                    )}
                    {isSending && (
                      <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Provider info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-gray-900 truncate">
                      {provider.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5">
                      {provider.rating && (
                        <>
                          <span className="text-amber-400">★</span>
                          <span>{provider.rating.toFixed(1)}</span>
                          <span className="text-gray-300">·</span>
                        </>
                      )}
                      {provider.distanceMiles != null ? (
                        <span>{provider.distanceMiles.toFixed(1)} mi</span>
                      ) : provider.city ? (
                        <span>{provider.city}</span>
                      ) : null}
                      {provider.priceRange && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="font-medium">{provider.priceRange}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sent status badge */}
                  {isSent && (
                    <span className="shrink-0 flex items-center gap-1.5 text-[13px] text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Sent
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── Email Capture Block ────────────────────────────────────────── */}
          <div
            className={`
              mt-5 p-5 rounded-2xl bg-[#F5F2EB]
              transition-all duration-500 ease-out delay-200
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {isLoggedIn ? (
              /* ─── Logged-in User: Simple confirmation ─────────────────────── */
              <div className="text-center py-1">
                <p className="text-[15px] text-gray-800 font-medium">
                  {totalSentCount} question{totalSentCount !== 1 ? "s" : ""} sent
                </p>
                <p className="text-[13px] text-gray-500 mt-1">
                  We&apos;ll email {userEmail} when providers reply
                </p>
              </div>
            ) : (
              /* ─── Guest User: Email capture form ──────────────────────────── */
              <>
                {/* Headline */}
                <p className="text-[15px] text-gray-800 leading-relaxed">
                  Add your email to <span className="font-semibold">get {firstName}&apos;s reply</span>.
                </p>

                {/* Input + Button Row */}
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <div className="flex-1 min-w-0">
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className={`
                        w-full px-4 py-3
                        text-[15px] text-gray-900 placeholder-gray-400
                        bg-white border rounded-xl
                        transition-all duration-200 ease-out
                        focus:outline-none disabled:opacity-50
                        ${inputFocused
                          ? "border-primary-400 ring-2 ring-primary-100"
                          : error
                            ? "border-red-300"
                            : "border-gray-200"
                        }
                      `}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !email.trim()}
                    className="
                      shrink-0 px-5 py-3
                      text-[15px] font-semibold text-white
                      bg-primary-600 rounded-xl
                      transition-all duration-200 ease-out
                      hover:bg-primary-700 active:scale-[0.98]
                      disabled:opacity-40 disabled:cursor-not-allowed
                      sm:w-auto w-full
                    "
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      buttonText
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-[13px] text-red-600 mt-2 font-medium">
                    {error}
                  </p>
                )}

                {/* Fine print */}
                <p className="text-[13px] text-gray-500 mt-3 leading-relaxed">
                  {finePrint}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
