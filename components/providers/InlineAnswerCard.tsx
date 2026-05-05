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

  // Extract first name - handle names starting with (Test) or similar prefixes
  const cleanName = providerName?.replace(/^\([^)]+\)\s*/, "") || "";
  const firstName = cleanName.split(/\s/)[0] || providerName?.split(/\s/)[0] || "them";

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted && inputRef.current && !showSuccess) {
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 450);
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
      const timer = setTimeout(() => {
        onCollapse();
      }, 5000);
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
    try {
      await onEmailSubmit(email.trim().toLowerCase());
    } catch (err) {
      // Display API errors (e.g., provider email, network errors)
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
      className={`
        bg-white rounded-2xl
        shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]
        border border-gray-100/80
        overflow-hidden
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      <div className="p-6">
        {/* Question with sent badge - styled like benefits module */}
        <div
          className={`
            transition-all duration-500 ease-out delay-75
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
          `}
        >
          <p className="font-display italic text-[15px] text-gray-500 leading-relaxed">
            <span className="text-gray-700">&ldquo;{question}&rdquo;</span>
            {questionSent && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 not-italic">
                Sent
              </span>
            )}
          </p>
        </div>

        {/* Answer section */}
        <div
          className={`
            mt-5
            transition-all duration-500 ease-out delay-150
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
          `}
        >
          <p className="text-[17px] text-gray-900 font-medium leading-relaxed">
            {answer}
          </p>
        </div>

        {/* Spacer */}
        <div className="h-6" />

        {showSuccess ? (
          /* Success state */
          <button
            type="button"
            onClick={onCollapse}
            className={`
              w-full rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100/50
              py-8 cursor-pointer
              transition-all duration-700 ease-out
              hover:from-gray-100/80 hover:to-gray-100/80
              ${showSuccess ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            `}
          >
            <div className="relative w-fit mx-auto mb-4">
              {providerImage ? (
                <img
                  src={providerImage}
                  alt={firstName}
                  className="w-16 h-16 rounded-full object-cover ring-[3px] ring-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-[3px] ring-white shadow-md">
                  <span className="text-2xl font-semibold text-gray-500">
                    {firstName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            </div>

            <p className="text-[16px] font-semibold text-gray-900">
              Connected with {firstName}
            </p>
            <p className="text-[14px] text-gray-500 mt-1">
              We&apos;ll email you when they reply
            </p>
          </button>
        ) : (
          /* Email capture zone */
          <div
            className={`
              transition-all duration-500 ease-out delay-200
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
            `}
          >
            {/* Personal zone */}
            <div className="rounded-2xl bg-gray-50/70 p-5 border border-gray-100/50">
              {/* Avatar */}
              <div className="flex justify-center mb-3">
                {providerImage ? (
                  <img
                    src={providerImage}
                    alt={firstName}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-2 ring-white shadow-sm">
                    <span className="text-xl font-semibold text-gray-500">
                      {firstName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* CTA text */}
              <p className="text-center text-[16px] text-gray-600 mb-4">
                <span className="font-semibold text-gray-900">{firstName}</span> will answer you directly
              </p>

              {/* Input with button inside */}
              <div
                className={`
                  relative flex items-center
                  bg-white rounded-full
                  transition-all duration-200 ease-out
                  ${inputFocused
                    ? "ring-2 ring-gray-900 ring-offset-1"
                    : "ring-1 ring-gray-200 hover:ring-gray-300"
                  }
                  ${error ? "ring-2 ring-red-300 ring-offset-1" : ""}
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
                    flex-1 min-w-0 pl-5 pr-2 py-3
                    text-[15px] text-gray-900 placeholder-gray-400
                    bg-transparent border-none
                    focus:outline-none disabled:opacity-50
                  "
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !email.trim()}
                  className={`
                    mr-1.5 w-9 h-9 rounded-full
                    flex items-center justify-center
                    transition-all duration-200 ease-out
                    ${email.trim() && !isSubmitting
                      ? "bg-gray-900 hover:bg-black active:scale-95"
                      : "bg-gray-200"
                    }
                    disabled:cursor-not-allowed
                  `}
                  aria-label="Send"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg
                      className={`w-4 h-4 transition-colors ${email.trim() ? "text-white" : "text-gray-400"}`}
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

              {error ? (
                <p className="text-[13px] text-red-500 mt-2.5 text-center font-medium">
                  {error}
                </p>
              ) : (
                <p className="text-[12px] text-gray-400 mt-2.5 text-center flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  We&apos;ll notify you · No spam
                </p>
              )}
            </div>

            {/* Save for later - bolder text */}
            <button
              type="button"
              onClick={handleSave}
              className="
                w-full group flex items-center justify-center gap-2
                mt-4 py-3
                text-[15px] font-medium text-gray-500 hover:text-gray-700
                transition-all duration-200
              "
            >
              <svg
                className="w-[18px] h-[18px] transition-all duration-300 ease-out group-hover:text-rose-400 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <span>Save for later</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
