"use client";

import { useState } from "react";

interface QAEntry {
  question: string;
  answer: string;
}

interface QASectionProps {
  providerName: string;
  providerImage?: string;
  questions: QAEntry[];
  suggestedQuestions?: string[];
}

export default function QASectionV2({
  providerName,
  providerImage,
  questions,
  suggestedQuestions = [
    "When can a caregiver be available?",
    "Do you have shift minimums?",
    "What are the per-hour costs?",
    "Do caregivers give meds?",
  ],
}: QASectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [showAll, setShowAll] = useState(false);

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
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-all"
        />
        <div className="flex justify-end mt-3">
          <button className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors">
            Post Question
          </button>
        </div>
      </div>

      {/* Empty state or Q&A threads */}
      {hasQuestions ? (
        <>
          <div className="space-y-6">
            {visibleQuestions.map((qa, index) => (
              <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900">{qa.question}</p>

                    {/* Interaction row */}
                    <div className="flex items-center gap-3 mt-2.5">
                      <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3.215a.678.678 0 01.678-.678 2.487 2.487 0 012.322 3.354l-.57 1.49a.75.75 0 00.699 1.024h2.51a1.5 1.5 0 011.46 1.848l-1.474 6.396a3 3 0 01-2.921 2.32H10.32a3 3 0 01-2.32-1.1L6 14.5" />
                        </svg>
                        1
                      </button>
                      <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                        </svg>
                        1
                      </button>
                    </div>
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
                        {/* Answer in muted background */}
                        <div className="bg-gray-50 rounded-lg px-4 py-3 mt-2">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {qa.answer.length > 200
                              ? qa.answer.slice(0, 200).trimEnd() + "..."
                              : qa.answer}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <button className="hover:text-gray-600 transition-colors">Helpful</button>
                          <span>·</span>
                          <button className="hover:text-gray-600 transition-colors">Report</button>
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
