"use client";

import { useState, useRef, useEffect } from "react";
import { getTemplateAnswer } from "@/lib/suggested-answer-templates";
import { getOrCreateSessionId } from "@/lib/analytics/session";

interface InlineAnswerCardProps {
  question: string;
  providerName: string;
  providerId: string;
  onEmailSubmit: (email: string) => Promise<void>;
  onSave: () => void;
  onCollapse: () => void;
  isSubmitting?: boolean;
  isSuccess?: boolean;
}

/**
 * Expanded inline answer card for the inline_answer A/B variant.
 *
 * Shows when a user taps a suggested question:
 * - Template answer (2 lines max)
 * - Email capture CTA with inline button
 * - Save fallback link
 */
export default function InlineAnswerCard({
  question,
  providerName,
  providerId,
  onEmailSubmit,
  onSave,
  onCollapse,
  isSubmitting = false,
  isSuccess = false,
}: InlineAnswerCardProps) {
  const answer = getTemplateAnswer(question);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus input after animation
  useEffect(() => {
    if (mounted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mounted]);

  // Track expansion
  useEffect(() => {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "inline_answer_expanded",
        related_provider_id: providerId,
        session_id: getOrCreateSessionId(),
        metadata: {
          question_text: question,
          variant: "inline_answer",
        },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [providerId, question]);

  // Handle success state transition
  useEffect(() => {
    if (isSuccess && !showSuccess) {
      setShowSuccess(true);
      // Auto-collapse after 3 seconds
      const timer = setTimeout(() => {
        onCollapse();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, showSuccess, onCollapse]);

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

    await onEmailSubmit(email.trim().toLowerCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSave = () => {
    // Track save click
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "inline_answer_saved",
        related_provider_id: providerId,
        session_id: getOrCreateSessionId(),
        metadata: {
          question_text: question,
          variant: "inline_answer",
        },
      }),
      keepalive: true,
    }).catch(() => {});

    onSave();
  };

  return (
    <div
      ref={cardRef}
      className={`
        overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm
        transition-all duration-300 ease-out
        ${mounted ? "opacity-100" : "opacity-0"}
      `}
      style={{
        transform: mounted ? "scaleY(1)" : "scaleY(0.95)",
        transformOrigin: "top",
      }}
    >
      <div className="p-5">
        {/* Question */}
        <p className="text-[15px] font-medium text-gray-900 leading-snug mb-3">
          {question}
        </p>

        {/* Answer with accent line */}
        <div
          className={`
            border-l-2 border-gray-200 pl-3.5 mb-5
            transition-all duration-300 delay-150
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
          `}
        >
          <p className="text-[14px] text-gray-600 leading-relaxed">
            {answer}
          </p>
        </div>

        {/* Email capture or success state */}
        {showSuccess ? (
          <div
            className={`
              flex items-center gap-3 py-3
              transition-all duration-200
              ${showSuccess ? "opacity-100" : "opacity-0"}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-medium text-gray-900">
                We&apos;ll let you know when {providerName} responds
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`
              transition-all duration-300 delay-200
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {/* CTA copy */}
            <p className="text-[14px] font-medium text-gray-800 mb-2">
              {providerName} would love to tell you more
            </p>

            {/* Email input row */}
            <div className="flex gap-0 mb-2">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="your email"
                autoComplete="email"
                disabled={isSubmitting}
                className={`
                  flex-1 min-w-0 px-3.5 py-2.5 border border-r-0 rounded-l-xl
                  text-[14px] text-gray-900 placeholder-gray-400 bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600
                  transition-all disabled:opacity-60 disabled:cursor-not-allowed
                  ${error ? "border-red-300" : "border-gray-200"}
                `}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !email.trim()}
                className={`
                  px-4 py-2.5 rounded-r-xl border border-l-0
                  text-[14px] font-semibold text-white
                  transition-all flex items-center gap-1.5 shrink-0
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${isSubmitting
                    ? "bg-gray-700 border-gray-700"
                    : "bg-gray-900 border-gray-900 hover:bg-gray-800 hover:border-gray-800 active:scale-[0.98]"
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-500 mb-2" role="alert">
                {error}
              </p>
            )}

            {/* Save fallback */}
            <button
              type="button"
              onClick={handleSave}
              className="group flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 group-hover:text-primary-500 transition-colors"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
              Save {providerName} for later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
