"use client";

import { useState, useRef, useEffect } from "react";
import { getTemplateAnswer } from "@/lib/suggested-answer-templates";
import { getOrCreateSessionId } from "@/lib/analytics/session";

interface InlineAnswerCardProps {
  question: string;
  providerName: string;
  providerImage?: string;
  providerId: string;
  providerLocation?: string;
  providerCareTypes?: string[];
  onEmailSubmit: (email: string) => Promise<void>;
  onSave: () => void;
  onCollapse: () => void;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  questionSent?: boolean;
  /** If provided, user is logged in — skip email capture and show confirmation */
  userEmail?: string;
}

export default function InlineAnswerCard({
  question,
  providerName,
  providerImage,
  providerId,
  providerLocation,
  providerCareTypes,
  onEmailSubmit,
  onSave,
  onCollapse,
  isSubmitting = false,
  isSuccess = false,
  questionSent = false,
  userEmail,
}: InlineAnswerCardProps) {
  const isLoggedIn = Boolean(userEmail);
  const answer = getTemplateAnswer(question);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const expandTrackedRef = useRef(false);
  const loggedInCollapseScheduledRef = useRef(false);

  // Extract first name - handle names starting with (Test) or similar prefixes
  // Also strip trailing 's (possessive) so "Effy's Homecare" becomes "Effy" not "Effy's"
  const cleanName = providerName?.replace(/^\([^)]+\)\s*/, "") || "";
  const rawFirstName = cleanName.split(/\s/)[0] || providerName?.split(/\s/)[0] || "them";
  const firstName = rawFirstName.replace(/'s$/i, "") || rawFirstName;

  // Build contextual label: "Typical for home care in Texas"
  // Strip parentheticals like "(Non-medical)" for cleaner display
  const rawCareType = providerCareTypes?.[0]?.toLowerCase() || "care";
  const careType = rawCareType.replace(/\s*\([^)]*\)/g, "").trim() || "care";
  const location = providerLocation?.split(",")[0]?.trim() || null;
  const contextLabel = location
    ? `Typical for ${careType} in ${location}`
    : `Typical for ${careType} providers`;

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

  // Auto-focus input on desktop only (mobile keyboard would obscure the answer)
  useEffect(() => {
    if (mounted && inputRef.current && !showSuccess) {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (isDesktop) {
        const focusTimer = setTimeout(() => {
          inputRef.current?.focus();
        }, 600);
        return () => clearTimeout(focusTimer);
      }
    }
  }, [mounted, showSuccess]);

  // Track expansion — deduplicated via ref (same pattern as benefits module)
  useEffect(() => {
    if (expandTrackedRef.current) return;
    expandTrackedRef.current = true;
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "inline_answer_expanded",
        related_provider_id: providerId,
        session_id: getOrCreateSessionId(),
        metadata: { question_text: question, variant: "inline_answer" },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [providerId, question]);

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
  // They don't need to submit email, so we collapse after a delay
  // Use ref to schedule once — QASectionV2 resets questionSent after 3s which would
  // otherwise clear the timer via effect cleanup
  useEffect(() => {
    if (isLoggedIn && mounted && questionSent && !loggedInCollapseScheduledRef.current) {
      loggedInCollapseScheduledRef.current = true;
      setTimeout(() => {
        onCollapse();
      }, 5000);
    }
  }, [isLoggedIn, mounted, questionSent, onCollapse]);

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
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSave = () => {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "inline_answer_saved",
        related_provider_id: providerId,
        session_id: getOrCreateSessionId(),
        metadata: { question_text: question, variant: "inline_answer" },
      }),
      keepalive: true,
    }).catch(() => {});
    onSave();
  };

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
           Success State — Polished confirmation with brand colors
           ═══════════════════════════════════════════════════════════════ */
        <button
          type="button"
          onClick={onCollapse}
          className={`
            w-full p-8 cursor-pointer text-center
            transition-all duration-700 ease-out
            hover:bg-gray-50/50
            ${showSuccess ? "opacity-100 scale-100" : "opacity-0 scale-95"}
          `}
        >
          {/* Celebratory checkmark icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg shadow-primary-200 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-[19px] font-semibold text-gray-900">
            {firstName} will reply soon
          </p>
          <p className="text-[14px] text-gray-500 mt-1 leading-relaxed">
            We&apos;ll email you when they respond.
            <br className="hidden sm:block" />
            Most providers reply within 24 hours.
          </p>
          {/* Save option */}
          <p className="text-[13px] text-gray-500 mt-4">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onSave(); } }}
              className="font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2 cursor-pointer"
            >
              Save {firstName}
            </span>{" "}for later.
          </p>
        </button>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           Main Card — Question → Context → Answer → Action
           ═══════════════════════════════════════════════════════════════ */
        <div className="p-6">
          {/* ─── Question Block — plain text, the user knows what they asked ─── */}
          <div
            className={`
              transition-all duration-500 ease-out delay-75
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[16px] text-gray-800 leading-relaxed flex-1">
                {question}
              </p>
              {questionSent && (
                <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 tracking-wide uppercase">
                  Sent
                </span>
              )}
            </div>
          </div>

          {/* ─── Answer Block — italicized with quotes, the valuable content ─── */}
          <div
            className={`
              mt-4
              transition-all duration-500 ease-out delay-100
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {/* Context label — tighter to answer */}
            <p className="text-[12px] text-gray-500 uppercase tracking-wide mb-1.5">
              {contextLabel}
            </p>
            {/* Answer in quotes, italic, feels like a direct response */}
            <p className="font-display italic text-[17px] text-gray-900 leading-[1.6]">
              &ldquo;{answer}&rdquo;
            </p>
          </div>

          {/* ─── Divider ────────────────────────────────────────────────── */}
          <div
            className={`
              my-6
              transition-all duration-500 ease-out delay-200
              ${mounted ? "opacity-100" : "opacity-0"}
            `}
          >
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* ─── Email Capture Block (or Logged-in Confirmation) ─────────── */}
          <div
            className={`
              transition-all duration-500 ease-out delay-200
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {isLoggedIn ? (
              /* ─── Logged-in User: Simple confirmation ─────────────────────── */
              <div className="flex items-center gap-3">
                {providerImage ? (
                  <img
                    src={providerImage}
                    alt={firstName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
                    <span className="text-sm font-semibold text-gray-500">
                      {firstName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-[16px] text-gray-900 font-medium">
                    We&apos;ll notify you when {firstName} replies
                  </p>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    Check your email for their response
                  </p>
                </div>
              </div>
            ) : (
              /* ─── Guest User: Email capture form ──────────────────────────── */
              <>
                {/* CTA with Avatar */}
                <div className="flex items-center gap-3 mb-4">
                  {providerImage ? (
                    <img
                      src={providerImage}
                      alt={firstName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
                      <span className="text-sm font-semibold text-gray-500">
                        {firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="text-[16px] text-gray-700">
                    Hear directly from <span className="font-semibold text-gray-900">{firstName}</span>.
                  </p>
                </div>

                {/* Input + Button Row — stacks on mobile */}
                <div className="flex flex-col sm:flex-row gap-3">
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
                      placeholder="your email"
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
                            ? "border-red-300 ring-2 ring-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }
                      `}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !email.trim()}
                    className={`
                      shrink-0 px-5 py-3
                      text-[15px] font-semibold text-white
                      bg-primary-600 rounded-xl
                      transition-all duration-200 ease-out
                      hover:bg-primary-700 active:scale-[0.98]
                      disabled:opacity-40 disabled:cursor-not-allowed
                      disabled:hover:bg-primary-600
                      sm:w-auto w-full
                    `}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Send their reply"
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-[13px] text-red-600 mt-2 font-medium">
                    {error}
                  </p>
                )}

                {/* Trust Line + Save Fallback */}
                <p className="text-[13px] text-gray-500 mt-4 leading-relaxed">
                  One email. No calls. Or{" "}
                  <button
                    type="button"
                    onClick={handleSave}
                    className="font-medium text-gray-700 underline underline-offset-2 decoration-gray-300 hover:text-gray-900 hover:decoration-gray-500 transition-colors"
                  >
                    save for later
                  </button>
                  {" "}— no email needed.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
