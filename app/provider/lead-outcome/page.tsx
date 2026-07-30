"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Provider lead-outcome landing page — the provider twin of
 * /connection-outcome. Reached from the one-tap "did this family become a
 * client?" email, keyed by the connection id (?cid=) and the answer
 * (?v=client|talking|no). No login required.
 *
 * The answer is recorded via a client-side POST on mount — one tap for a real
 * person, but safe from email-security scanners (they issue GETs and don't
 * run JS, so a scanner following all three chips can't overwrite the real
 * answer).
 */

interface OutcomeResult {
  value: "client" | "talking" | "no";
  providerName?: string;
}

function LeadOutcomeInner() {
  const params = useSearchParams();
  const cid = params.get("cid");
  const value = params.get("v");

  const valid = cid && (value === "client" || value === "talking" || value === "no");
  const [status, setStatus] = useState<"loading" | "done" | "error">(valid ? "loading" : "error");
  const [result, setResult] = useState<OutcomeResult | null>(null);

  const record = useCallback(async () => {
    if (!valid) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/provider/lead-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, value }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = (await res.json()) as OutcomeResult;
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [valid, cid, value]);

  useEffect(() => {
    void record();
  }, [record]);

  const v = result?.value;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {status === "loading" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Saving your answer…</h1>
            <p className="text-gray-500">One moment.</p>
          </div>
        ) : status === "done" && v === "client" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">That&apos;s a win worth counting</h1>
            <p className="text-gray-500 mb-6">
              Congratulations. We&apos;ve added it to your campaign results, so your numbers now show
              what actually happened, not just clicks.
            </p>
            <Link
              href="/provider/boost"
              className="block w-full text-center px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              See your campaign results
            </Link>
          </div>
        ) : status === "done" && v === "talking" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Got it, still in progress</h1>
            <p className="text-gray-500 mb-6">
              Good luck with the conversation. We&apos;ll check back once more in a couple of weeks, and
              you can update this anytime from your campaign page.
            </p>
            <Link
              href="/provider/boost"
              className="block w-full text-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              View your campaign
            </Link>
          </div>
        ) : status === "done" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Thanks for the honest answer</h1>
            <p className="text-gray-500 mb-6">
              Not every inquiry works out, and knowing that helps us send you better-fit families.
              If something felt off about this one, reply to the email and a real person will read it.
            </p>
            <Link
              href="/provider/boost"
              className="block w-full text-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              View your campaign
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t save your answer. Please try the link again, or email{" "}
              <a href="mailto:support@olera.care" className="text-primary-600 hover:underline">
                support@olera.care
              </a>{" "}
              and we&apos;ll record it for you.
            </p>
            {valid ? (
              <button
                onClick={record}
                className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                Try again
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderLeadOutcomePage() {
  return (
    <Suspense fallback={null}>
      <LeadOutcomeInner />
    </Suspense>
  );
}
