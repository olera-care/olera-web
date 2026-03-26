"use client";

import { useState } from "react";
import Link from "next/link";

const QUESTIONS = [
  "Is your loved one enrolled in Texas Medicaid?",
  "Are you a family member or close friend?",
  "Do you live in Texas?",
];

type Answer = "yes" | "no" | null;

export default function EligibilityChecker() {
  const [answers, setAnswers] = useState<Answer[]>([null, null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const allYes = answers.every((a) => a === "yes");
  const someNo = answers.some((a) => a === "no");

  function handleAnswer(index: number, value: Answer) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    setSubmitted(false);
    setShowHint(false);
  }

  function handleCheck() {
    if (allAnswered) {
      setSubmitted(true);
      setShowHint(false);
    } else {
      setShowHint(true);
    }
  }

  function handleReset() {
    setAnswers([null, null, null]);
    setSubmitted(false);
  }

  return (
    <div className="my-10 rounded-2xl bg-gradient-to-b from-white to-gray-50/80 border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)] p-6 sm:p-8 not-prose ring-1 ring-gray-100/60">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        <h3 className="text-lg font-semibold text-gray-900">
          Quick Eligibility Check
        </h3>
      </div>
      <p className="text-sm text-gray-500 mb-6 ml-12">
        Answer these three questions to see if you may qualify.
      </p>

      {/* Questions */}
      <div className="space-y-4">
        {QUESTIONS.map((q, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl bg-primary-25 border border-primary-100/60 px-4 py-3.5"
          >
            <p className="flex-1 text-sm text-gray-800">{q}</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleAnswer(i, "yes")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  answers[i] === "yes"
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700 shadow-sm"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(i, "no")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  answers[i] === "no"
                    ? "bg-gray-800 text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800 shadow-sm"
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Check button */}
      {!submitted && (
        <>
          <button
            type="button"
            onClick={handleCheck}
            className="mt-6 w-full py-3 rounded-full text-sm font-semibold transition-all bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg cursor-pointer"
          >
            Check My Eligibility
          </button>
          {showHint && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Please answer all three questions above first.
            </p>
          )}
        </>
      )}

      {/* Result */}
      {submitted && (
        <div className="mt-6">
          {allYes ? (
            <div className="rounded-xl bg-primary-50 border border-primary-300 p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-primary-900">
                    You may qualify to get paid as a caregiver
                  </p>
                  <p className="text-sm text-primary-800 mt-1">
                    Based on your answers, you could be eligible for Texas
                    Medicaid&rsquo;s STAR+PLUS Consumer Directed Services. Keep
                    reading below for the step-by-step application process.
                  </p>
                </div>
              </div>
            </div>
          ) : someNo ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white flex-shrink-0 mt-0.5 text-sm font-bold">!</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    You may not qualify yet, but there are other options
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {!answers[0] || answers[0] === "no"
                      ? "Your loved one may need to enroll in Texas Medicaid first. "
                      : ""}
                    The Olera Benefits Finder can show you every program your
                    family may be eligible for.
                  </p>
                  <Link
                    href="/benefits/finder"
                    className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Check other Texas benefits &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleReset}
            className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
