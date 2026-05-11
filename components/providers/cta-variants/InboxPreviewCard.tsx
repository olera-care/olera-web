"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getQuestionsForCategory, splitQuestions } from "@/lib/cta-questions";

interface InboxPreviewCardProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerPhone?: string | null;
  providerImage?: string | null;
  acceptedPayments: string[];
  ctaVariant?: string | null;
  ctaSurface?: "desktop" | "mobile";
  ctaPreviewMode?: boolean;
  onQuestionSelected?: (questionText: string) => void;
}

type Step = "initial" | "questions";

/**
 * Desktop CTA card for the inbox_preview variant.
 * Step 1: "Start a message" button
 * Step 2: Question selection
 * After question selection → navigates to /inbox-preview page for full inbox experience
 */
export default function InboxPreviewCard({
  providerId,
  providerName,
  providerSlug,
  providerCategory,
  providerCity,
  providerState,
  providerPhone,
  providerImage,
  acceptedPayments,
  ctaVariant,
  ctaPreviewMode = false,
  onQuestionSelected,
}: InboxPreviewCardProps) {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("initial");
  const [expanded, setExpanded] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  // Get category-specific questions
  const questions = getQuestionsForCategory(providerCategory);
  const { initial: initialQuestions, expanded: expandedQuestions } = splitQuestions(questions);

  // Derived values
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");
  const categoryLocationStr = [providerCategory, locationStr].filter(Boolean).join(" · ");

  // Fire analytics event when "Start a message" is clicked
  const handleStartMessage = useCallback(() => {
    if (ctaVariant && !ctaPreviewMode) {
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: providerSlug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "desktop",
            action: "cta_started",
          },
        }),
      }).catch(() => {});
    }
    setStep("questions");
  }, [ctaVariant, ctaPreviewMode, providerSlug]);

  // Navigate to inbox preview page with question
  const navigateToInboxPreview = useCallback(
    (questionText: string) => {
      // Fire question_selected event
      onQuestionSelected?.(questionText);

      // Build URL with query params
      const params = new URLSearchParams({
        provider_id: providerId,
        provider: providerSlug,
        provider_name: providerName,
        question: questionText,
        cta_variant: ctaVariant || "inbox_preview",
      });

      if (providerCategory) params.set("category", providerCategory);
      if (providerCity) params.set("city", providerCity);
      if (providerState) params.set("state", providerState);
      if (providerPhone) params.set("phone", providerPhone);
      if (providerImage) params.set("image", providerImage);

      // Navigate to full-screen inbox preview
      router.push(`/inbox-preview?${params.toString()}`);
    },
    [
      onQuestionSelected,
      providerId,
      providerSlug,
      providerName,
      providerCategory,
      providerCity,
      providerState,
      providerPhone,
      providerImage,
      ctaVariant,
      router,
    ]
  );

  // Handle question click
  const handleQuestionClick = useCallback(
    (questionText: string) => {
      navigateToInboxPreview(questionText);
    },
    [navigateToInboxPreview]
  );

  // Handle custom question submit
  const handleCustomSubmit = useCallback(() => {
    const trimmed = customQuestion.trim();
    if (trimmed) {
      navigateToInboxPreview(trimmed);
    }
  }, [customQuestion, navigateToInboxPreview]);

  // ════════════════════════════════════════════════════════════════════════════
  // Step 1: Initial - "Start a message" button
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "initial") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Direct Line Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Direct Line — No Agents
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1 truncate">
            Message {providerName}
          </h3>

          {/* Category + Location */}
          {categoryLocationStr && (
            <p className="text-sm text-gray-500 mb-5 truncate">{categoryLocationStr}</p>
          )}

          {/* Start a message button */}
          <button
            onClick={handleStartMessage}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Start a message
          </button>
        </div>

        {/* Accepted payments */}
        {acceptedPayments.length > 0 && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400 mb-2">
              Accepted payments
            </p>
            <div className="flex flex-wrap gap-1.5">
              {acceptedPayments.map((payment) => (
                <span
                  key={payment}
                  className="text-xs text-gray-600 bg-white px-2.5 py-1 rounded border border-gray-200"
                >
                  {payment}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Step 2: Question Selection
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="px-5 pt-5 pb-5">
        {/* Direct Line Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Direct Line — No Agents
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1 truncate">
          Message {providerName}
        </h3>

        {/* Category + Location */}
        {categoryLocationStr && (
          <p className="text-sm text-gray-500 mb-4 truncate">{categoryLocationStr}</p>
        )}

        {/* Tap to send instruction */}
        <p className="text-sm text-gray-500 mb-3">Tap to send</p>

        {/* Questions */}
        <div className="space-y-2">
          {initialQuestions.map((q) => (
            <button
              key={q.id}
              onClick={() => handleQuestionClick(q.text)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-left transition-colors group"
            >
              <span className="text-[15px] text-gray-800">
                {q.text}
              </span>
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}

          {/* Expanded questions */}
          {expanded && (
            <>
              {expandedQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleQuestionClick(q.text)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-left transition-colors group animate-step-in"
                >
                  <span className="text-[15px] text-gray-800">
                    {q.text}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}

              {/* Custom question input */}
              <div className="pt-2 animate-step-in">
                <div className="relative">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomSubmit();
                      }
                    }}
                    placeholder="Or type your own question..."
                    className="w-full px-4 py-3.5 pr-12 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                  />
                  {customQuestion.trim() && (
                    <button
                      onClick={handleCustomSubmit}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 transition-colors"
                      aria-label="Send question"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* More questions toggle */}
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-center py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              More questions{" "}
              <span className="inline-block ml-0.5">↓</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
