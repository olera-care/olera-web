"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Care-seeker (family) unsubscribe landing page.
 *
 * Keyed by the family profile id in the URL (?id=...) so it works for guests
 * with no login. The unsubscribe fires automatically on mount via a client-side
 * POST — that makes it effectively one-click for a real person while staying
 * safe from email-security scanners, which issue plain GETs and don't run JS.
 */
function CareUnsubscribeInner() {
  const id = useSearchParams().get("id");
  const [status, setStatus] = useState<"loading" | "done" | "resubscribed" | "error">(
    id ? "loading" : "error",
  );
  const [resubBusy, setResubBusy] = useState(false);

  const unsubscribe = useCallback(async () => {
    if (!id) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/families/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }, [id]);

  async function resubscribe() {
    if (!id) return;
    setResubBusy(true);
    try {
      const res = await fetch("/api/families/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, unsubscribe: false }),
      });
      setStatus(res.ok ? "resubscribed" : "error");
    } catch {
      setStatus("error");
    } finally {
      setResubBusy(false);
    }
  }

  useEffect(() => {
    void unsubscribe();
  }, [unsubscribe]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {status === "loading" ? (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Updating your preferences…</h1>
            <p className="text-gray-500">One moment.</p>
          </>
        ) : status === "done" ? (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">You&apos;ve been unsubscribed</h1>
            <p className="text-gray-500 mb-6">
              You&apos;ll no longer receive care-search update emails from Olera. Replies to messages
              from providers you&apos;re already talking with are unaffected.
            </p>
            <button
              onClick={resubscribe}
              disabled={resubBusy}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm disabled:opacity-50"
            >
              {resubBusy ? "Working…" : "Changed your mind? Re-subscribe"}
            </button>
          </>
        ) : status === "resubscribed" ? (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re re-subscribed</h1>
            <p className="text-gray-500 mb-6">Care-search update emails will continue.</p>
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              Go to Olera
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t update your preferences. Please try again, or email{" "}
              <a href="mailto:support@olera.care" className="text-primary-600 hover:underline">
                support@olera.care
              </a>{" "}
              and we&apos;ll take care of it.
            </p>
            {id ? (
              <button
                onClick={unsubscribe}
                className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                Try again
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function CareUnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <CareUnsubscribeInner />
    </Suspense>
  );
}
