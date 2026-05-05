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
  const inputRef = useRef<HTMLInputElement>(null);

  // Get first name for more personal copy
  const firstName = providerName.split(/[\s(]/)[0];

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted && inputRef.current && !showSuccess) {
      inputRef.current.focus();
    }
  }, [mounted, showSuccess]);

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
        bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100
        overflow-hidden
        transition-all duration-300 ease-out
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      {/* Question - subtle, already sent */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-gray-900 leading-relaxed">
              {question}
            </p>
            {questionSent && (
              <p className="text-[12px] text-gray-400 mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Sent to {firstName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Answer - from the provider */}
      <div
        className={`
          px-6 pb-5 transition-all duration-300 delay-75
          ${mounted ? "opacity-100" : "opacity-0"}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Provider avatar */}
          {providerImage ? (
            <img
              src={providerImage}
              alt={providerName}
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
              <span className="text-sm font-semibold text-white">
                {firstName.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[14px] font-semibold text-gray-900">{firstName}</span>
              <span className="text-[11px] text-gray-400">typically responds</span>
            </div>

            {/* The answer - conversational style */}
            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-[15px] text-gray-700 leading-relaxed">
                {answer}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email capture - feels like continuing the conversation */}
      <div
        className={`
          border-t border-gray-100 bg-gray-50/50 px-6 py-5
          transition-all duration-300 delay-150
          ${mounted ? "opacity-100" : "opacity-0"}
        `}
      >
        {showSuccess ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-medium text-gray-900">You&apos;re all set</p>
              <p className="text-[13px] text-gray-500">We&apos;ll email you when {firstName} responds</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[15px] text-gray-900 mb-3">
              <span className="font-medium">Want {firstName} to respond directly?</span>
              <span className="text-gray-500 ml-1">Leave your email.</span>
            </p>

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@email.com"
                autoComplete="email"
                disabled={isSubmitting}
                className={`
                  flex-1 min-w-0 px-4 py-3 rounded-xl
                  text-[15px] text-gray-900 placeholder-gray-400
                  bg-white border shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300
                  transition-all disabled:opacity-60
                  ${error ? "border-red-300" : "border-gray-200"}
                `}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !email.trim()}
                className="
                  px-5 py-3 rounded-xl
                  text-[15px] font-medium text-white
                  bg-gray-900 hover:bg-gray-800
                  transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                  active:scale-[0.98]
                  flex items-center gap-2 shrink-0
                "
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>

            {error && (
              <p className="text-[13px] text-red-500 mt-2">{error}</p>
            )}

            {/* Secondary actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/60">
              <button
                type="button"
                onClick={handleSave}
                className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                Save for later
              </button>
              <button
                type="button"
                onClick={onCollapse}
                className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
