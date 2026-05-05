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
  questionSent?: boolean;
}

/**
 * Expanded inline answer card for the inline_answer A/B variant.
 *
 * Shows when a user taps a suggested question:
 * - Question with "Sent" indicator
 * - Prominent template answer
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
  questionSent = false,
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

  // Handle success state transition - but DON'T auto-collapse
  useEffect(() => {
    if (isSuccess && !showSuccess) {
      setShowSuccess(true);
    }
  }, [isSuccess, showSuccess]);

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
        overflow-hidden rounded-2xl border-2 border-primary-200 bg-gradient-to-b from-primary-50/50 to-white
        shadow-lg shadow-primary-100/50
        transition-all duration-300 ease-out
        ${mounted ? "opacity-100" : "opacity-0"}
      `}
      style={{
        transform: mounted ? "scaleY(1)" : "scaleY(0.95)",
        transformOrigin: "top",
      }}
    >
      {/* Question header with sent badge */}
      <div className="bg-white border-b border-primary-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[16px] font-semibold text-gray-900 leading-snug flex-1">
            {question}
          </p>
          {questionSent && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Sent
            </span>
          )}
        </div>
      </div>

      {/* Answer section - prominent */}
      <div className="px-5 py-5">
        <div
          className={`
            bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm
            transition-all duration-300 delay-100
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
          `}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wide mb-1">
                Quick Answer
              </p>
              <p className="text-[15px] text-gray-700 leading-relaxed">
                {answer}
              </p>
            </div>
          </div>
        </div>

        {/* Email capture or success state */}
        {showSuccess ? (
          <div
            className={`
              bg-emerald-50 rounded-xl border border-emerald-200 p-4
              transition-all duration-200
              ${showSuccess ? "opacity-100" : "opacity-0"}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-emerald-900">
                  You&apos;re all set!
                </p>
                <p className="text-[13px] text-emerald-700">
                  We&apos;ll email you when {providerName} responds
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`
              transition-all duration-300 delay-150
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {/* CTA header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-gray-900">
                Get {providerName}&apos;s full response
              </p>
            </div>

            <p className="text-[13px] text-gray-500 mb-3">
              We&apos;ll notify you when they reply — no spam, just their answer.
            </p>

            {/* Email input row */}
            <div className="flex gap-0 mb-2">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="your@email.com"
                autoComplete="email"
                disabled={isSubmitting}
                className={`
                  flex-1 min-w-0 px-4 py-3 border border-r-0 rounded-l-xl
                  text-[15px] text-gray-900 placeholder-gray-400 bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                  transition-all disabled:opacity-60 disabled:cursor-not-allowed
                  ${error ? "border-red-300" : "border-gray-300"}
                `}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !email.trim()}
                className={`
                  px-5 py-3 rounded-r-xl border border-l-0
                  text-[15px] font-semibold text-white
                  transition-all flex items-center gap-2 shrink-0
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${isSubmitting
                    ? "bg-gray-600 border-gray-600"
                    : "bg-gray-900 border-gray-900 hover:bg-gray-800 active:scale-[0.98]"
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Notify me
                    <svg
                      className="w-4 h-4"
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
              <p className="text-[13px] text-red-500 mb-2" role="alert">
                {error}
              </p>
            )}

            {/* Save fallback */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSave}
                className="group flex items-center gap-2 text-[13px] text-gray-500 hover:text-primary-600 transition-colors"
              >
                <svg
                  className="w-4 h-4 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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

              <button
                type="button"
                onClick={onCollapse}
                className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
