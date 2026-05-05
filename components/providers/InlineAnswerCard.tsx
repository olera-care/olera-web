"use client";

import { useState, useRef, useEffect } from "react";
import { getTemplateAnswer } from "@/lib/suggested-answer-templates";
import { getOrCreateSessionId } from "@/lib/analytics/session";

interface InlineAnswerCardProps {
  question: string;
  providerName: string;
  providerImage?: string;
  providerId: string;
  onEmailSubmit: (email: string) => Promise<void>;
  onSave: () => void;
  onCollapse: () => void;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  questionSent?: boolean;
}

export default function InlineAnswerCard({
  question,
  providerName,
  providerImage,
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
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = providerName.split(/[\s(]/)[0];

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted && inputRef.current && !showSuccess) {
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
      return () => clearTimeout(focusTimer);
    }
  }, [mounted, showSuccess]);

  useEffect(() => {
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
      className={`
        bg-white rounded-2xl shadow-xl shadow-gray-200/60
        border border-gray-100
        overflow-hidden
        transition-all duration-500 ease-out
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}
      `}
    >
      <div className="px-6 pt-6 pb-5">
        {/* Sent confirmation + Question */}
        <div
          className={`
            transition-all duration-500 delay-75
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
          `}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="text-[14px] text-emerald-600 font-medium">
              Sent to {firstName}
            </span>
          </div>

          <p className="text-[18px] font-semibold text-gray-900 leading-snug mb-4">
            {question}
          </p>
        </div>

        {/* Answer - unattributed, helpful info */}
        <div
          className={`
            transition-all duration-500 delay-150
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
          `}
        >
          <p className="text-[15px] text-gray-600 leading-relaxed">
            {answer}
          </p>
        </div>

        {/* Divider */}
        <div
          className={`
            my-5 h-px bg-gray-100
            transition-all duration-500 delay-200
            ${mounted ? "opacity-100" : "opacity-0"}
          `}
        />

        {showSuccess ? (
          /* Success state - warm and reassuring */
          <div
            className={`
              text-center py-6
              transition-all duration-500
              ${showSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {providerImage ? (
              <img
                src={providerImage}
                alt={firstName}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-4 ring-4 ring-emerald-50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-50">
                <span className="text-2xl font-semibold text-gray-600">
                  {firstName.charAt(0)}
                </span>
              </div>
            )}
            <p className="text-[17px] font-semibold text-gray-900 mb-1">
              You&apos;re connected with {firstName}
            </p>
            <p className="text-[14px] text-gray-500">
              We&apos;ll email you when they reply
            </p>
          </div>
        ) : (
          /* Email capture - the personal zone */
          <div
            className={`
              transition-all duration-500 delay-250
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {/* Personal zone - subtle container */}
            <div className="rounded-xl bg-gray-50/80 p-5 mb-4">
              {/* Avatar - centered, the human connection */}
              <div className="flex justify-center mb-3">
                {providerImage ? (
                  <img
                    src={providerImage}
                    alt={firstName}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-2 ring-white shadow-sm">
                    <span className="text-xl font-semibold text-gray-600">
                      {firstName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* The ask - centered, personal */}
              <p className="text-center text-[15px] text-gray-700 font-medium mb-4">
                Get {firstName}&apos;s personal reply
              </p>

              {/* Input with button inside - pill shaped */}
              <div
                className={`
                  relative flex items-center
                  bg-white rounded-full
                  border-2 transition-all duration-200
                  ${inputFocused ? "border-gray-900 shadow-sm" : "border-gray-200"}
                  ${error ? "border-red-300" : ""}
                `}
              >
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
                  className="
                    flex-1 min-w-0 px-5 py-3.5
                    text-[15px] text-gray-900 placeholder-gray-400
                    bg-transparent border-none
                    focus:outline-none disabled:opacity-60
                    rounded-l-full
                  "
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !email.trim()}
                  className="
                    mr-1.5 p-2.5 rounded-full
                    bg-gray-900 hover:bg-black
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    transition-all duration-200
                    active:scale-95
                    flex items-center justify-center
                  "
                  aria-label="Send"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-[13px] text-red-500 mt-2 text-center">{error}</p>
              )}
            </div>

            {/* Save for later - simple, warm */}
            <button
              type="button"
              onClick={handleSave}
              className="
                w-full group flex items-center justify-center gap-2 py-3
                text-[14px] text-gray-500 hover:text-gray-700
                transition-all duration-200
              "
            >
              <svg
                className="w-4 h-4 transition-all duration-200 group-hover:text-rose-400 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              Save for later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
