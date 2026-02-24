"use client";

import { useState, useEffect, useCallback } from "react";

interface QAEntry {
  id?: string;
  question: string;
  answer: string;
  asker_name?: string;
  created_at?: string;
}

interface QASectionProps {
  providerId: string;
  providerName: string;
  providerImage?: string;
  questions?: QAEntry[];
  suggestedQuestions?: string[];
}

export default function QASectionV2({
  providerId,
  providerName,
  providerImage,
  questions: initialQuestions = [],
  suggestedQuestions = [
    "When can a caregiver be available?",
    "Do you have shift minimums?",
    "What are the per-hour costs?",
    "Do caregivers give meds?",
  ],
}: QASectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [questions, setQuestions] = useState<QAEntry[]>(initialQuestions);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "auth_required">("idle");

  // Fetch public questions on mount
  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/questions?provider_id=${encodeURIComponent(providerId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.questions?.length > 0) {
          setQuestions(data.questions.map((q: { question: string; answer: string | null; asker_name: string; created_at: string; id: string }) => ({
            id: q.id,
            question: q.question,
            answer: q.answer || "",
            asker_name: q.asker_name,
            created_at: q.created_at,
          })));
        }
      }
    } catch {
      // Silently fail — questions are non-critical
    }
  }, [providerId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || submitting) return;

    setSubmitting(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: providerId, question: inputValue.trim() }),
      });

      if (res.status === 401) {
        setSubmitStatus("auth_required");
        return;
      }

      if (!res.ok) {
        setSubmitStatus("error");
        return;
      }

      setInputValue("");
      setSubmitStatus("success");
      // Clear success message after 4 seconds
      setTimeout(() => setSubmitStatus("idle"), 4000);
    } catch {
      setSubmitStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleQuestions = showAll ? questions : questions.slice(0, 2);
  const hasMore = questions.length > 2;
  const hasQuestions = questions.length > 0;

  return (
    <div>
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-900 font-serif mb-1">
        Customer Questions &amp; Answers
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ask your specific questions to {providerName}
      </p>

      {/* Suggested label + pills */}
      {suggestedQuestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Suggested</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setInputValue(q)}
                className="text-sm text-gray-700 px-3.5 py-2 border border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Textarea + Post button */}
      <div className="mb-8">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your question..."
          rows={3}
          maxLength={1000}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-all"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm">
            {submitStatus === "success" && (
              <span className="text-green-600">Question submitted! It will appear after review.</span>
            )}
            {submitStatus === "error" && (
              <span className="text-red-600">Failed to submit. Please try again.</span>
            )}
            {submitStatus === "auth_required" && (
              <span className="text-amber-600">Please sign in to ask a question.</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || submitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Post Question"}
          </button>
        </div>
      </div>

      {/* Empty state or Q&A threads */}
      {hasQuestions ? (
        <>
          <div className="space-y-6">
            {visibleQuestions.map((qa, index) => (
              <div key={qa.id || index} className="border-b border-gray-100 pb-6 last:border-b-0">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">{qa.question}</p>
                    </div>
                    {qa.asker_name && (
                      <p className="text-xs text-gray-400 mt-1">Asked by {qa.asker_name}</p>
                    )}
                  </div>
                </div>

                {/* Provider Answer */}
                {qa.answer && (
                  <div className="ml-12 mt-4">
                    <div className="flex items-start gap-3">
                      {providerImage ? (
                        <img
                          src={providerImage}
                          alt={providerName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-primary-700">
                            {providerName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary-700">{providerName}</span>
                          <span className="text-xs font-medium text-primary-600">· Provider</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-4 py-3 mt-2">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {qa.answer.length > 200
                              ? qa.answer.slice(0, 200).trimEnd() + "..."
                              : qa.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show More */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
            >
              {showAll ? "Show fewer questions" : `View all ${questions.length} questions`}
              <svg
                className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-xl py-8 px-6 flex flex-col items-center text-center">
          <svg className="w-6 h-6 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-11.25 5.25v-1.875a3.375 3.375 0 013.375-3.375h6.75a3.375 3.375 0 013.375 3.375v1.875m-16.5 0h16.5" />
          </svg>
          <p className="text-sm text-gray-500">No questions yet.</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to ask {providerName} a question.</p>
        </div>
      )}
    </div>
  );
}
