"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  ctaSurface = "desktop",
  ctaPreviewMode = false,
  onQuestionSelected,
}: InboxPreviewCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  // Get category-specific questions
  const questions = getQuestionsForCategory(providerCategory);
  const { initial, expanded: expandedQuestions } = splitQuestions(questions);

  // Extract first name from provider name
  const providerFirstName = providerName.split(" ")[0];

  // Navigate to inbox preview page
  const navigateToInboxPreview = useCallback(
    (questionText: string) => {
      // Fire the question selected callback for analytics
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

      router.push(`/inbox-preview?${params.toString()}`);
    },
    [
      providerId,
      providerSlug,
      providerName,
      providerCategory,
      providerCity,
      providerState,
      providerPhone,
      providerImage,
      ctaVariant,
      onQuestionSelected,
      router,
    ]
  );

  const handleQuestionClick = useCallback(
    (questionText: string) => {
      navigateToInboxPreview(questionText);
    },
    [navigateToInboxPreview]
  );

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customQuestion.trim();
    if (trimmed) {
      navigateToInboxPreview(trimmed);
    }
  }, [customQuestion, navigateToInboxPreview]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        {/* Direct Line Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Direct Line — No Agents
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-lg font-bold text-gray-900 leading-snug">
          Message {providerFirstName}. No one else.
        </h3>
      </div>

      {/* Questions */}
      <div className="px-5 pb-5 space-y-2">
        {/* Initial 3 questions */}
        {initial.map((q) => (
          <button
            key={q.id}
            onClick={() => handleQuestionClick(q.text)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors group"
          >
            <span className="text-[15px] text-gray-800 font-medium">
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

        {/* Expanded questions (hidden by default) */}
        {expanded && (
          <>
            {expandedQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuestionClick(q.text)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors group animate-step-in"
              >
                <span className="text-[15px] text-gray-800 font-medium">
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
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
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

        {/* Expand toggle */}
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

      {/* Bottom section — accepted payments */}
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
