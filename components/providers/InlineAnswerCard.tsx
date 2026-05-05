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
        bg-white rounded-3xl shadow-2xl shadow-gray-300/40
        border border-gray-200/80
        overflow-hidden
        transition-all duration-500 ease-out
        ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-[0.98]"}
      `}
    >
      {/* Your question - acknowledged */}
      <div className="px-7 pt-6 pb-2">
        <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          You asked
        </p>
        <p className="text-[20px] font-semibold text-gray-900 leading-snug">
          {question}
        </p>
        {questionSent && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[13px] text-emerald-600 font-medium">Sent to {firstName}</span>
          </div>
        )}
      </div>

      {/* The answer - THE HERO */}
      <div
        className={`
          mx-4 my-4 p-5
          bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-yellow-50/60
          rounded-2xl border border-amber-100/80
          transition-all duration-500 delay-100
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        `}
      >
        <div className="flex items-start gap-4">
          {/* Provider presence */}
          <div className="shrink-0">
            {providerImage ? (
              <img
                src={providerImage}
                alt={providerName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center ring-2 ring-white shadow-md">
                <span className="text-lg font-bold text-white">
                  {firstName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[15px] font-bold text-gray-900">{firstName}</span>
              <span className="text-[12px] text-amber-700/70 font-medium">quick answer</span>
            </div>

            {/* The answer itself - BOLD */}
            <p className="text-[17px] text-gray-800 leading-relaxed font-medium">
              {answer}
            </p>
          </div>
        </div>
      </div>

      {/* Continue the conversation */}
      <div
        className={`
          px-7 pt-4 pb-6
          transition-all duration-500 delay-200
          ${mounted ? "opacity-100" : "opacity-0"}
        `}
      >
        {showSuccess ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-[18px] font-semibold text-gray-900 mb-1">You&apos;re connected</p>
            <p className="text-[15px] text-gray-500">We&apos;ll email you when {firstName} responds</p>
          </div>
        ) : (
          <>
            {/* The ask - warm and direct */}
            <p className="text-[18px] text-gray-900 mb-4 leading-snug">
              <span className="font-semibold">Want the full answer?</span>
              <br />
              <span className="text-gray-500 text-[16px]">{firstName} can tell you more directly.</span>
            </p>

            {/* Email input - clean and inviting */}
            <div className="flex gap-3">
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
                  flex-1 min-w-0 px-5 py-4 rounded-2xl
                  text-[16px] text-gray-900 placeholder-gray-400
                  bg-gray-100/80 border-2 border-transparent
                  focus:outline-none focus:bg-white focus:border-gray-900
                  transition-all duration-200 disabled:opacity-60
                  ${error ? "border-red-300 bg-red-50" : ""}
                `}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !email.trim()}
                className="
                  px-7 py-4 rounded-2xl
                  text-[16px] font-semibold text-white
                  bg-gray-900 hover:bg-black
                  shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                  active:scale-[0.98]
                  shrink-0
                "
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Connect"
                )}
              </button>
            </div>

            {error && (
              <p className="text-[14px] text-red-500 mt-2 font-medium">{error}</p>
            )}

            {/* Save as alternative - warm, not an afterthought */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSave}
                className="w-full group flex items-center justify-center gap-2 py-3 rounded-xl
                  text-[15px] font-medium text-gray-600
                  hover:bg-gray-50 hover:text-gray-900
                  transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-rose-500 group-hover:scale-110 transition-all"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                Not ready? Save {firstName} for later
              </button>
            </div>

            {/* Close - minimal */}
            <button
              type="button"
              onClick={onCollapse}
              className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 mt-3 py-2 transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
