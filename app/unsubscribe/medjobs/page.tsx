"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * MedJobs student unsubscribe landing page.
 *
 * Keyed by the student profile id in the URL (?id=...) so it works for guests
 * with no login. The unsubscribe fires automatically on mount via a client-side
 * POST — that makes it effectively one-click for a real person while staying
 * safe from email-security scanners, which issue plain GETs and don't run JS.
 */
function MedJobsUnsubscribeInner() {
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
      const res = await fetch("/api/students/unsubscribe", {
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
      const res = await fetch("/api/students/unsubscribe", {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-xl font-bold text-primary-600">Olera MedJobs</span>
        </div>

        {status === "loading" && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
            <p className="text-gray-600">Processing your request...</p>
          </div>
        )}

        {status === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">You&apos;ve been unsubscribed</h1>
            <p className="mb-6 text-gray-600">
              You will no longer receive MedJobs updates. Important account emails will still be sent.
            </p>
            <button
              onClick={resubscribe}
              disabled={resubBusy}
              className="text-sm text-primary-600 hover:underline disabled:opacity-50"
            >
              {resubBusy ? "Processing..." : "Changed your mind? Re-subscribe"}
            </button>
          </div>
        )}

        {status === "resubscribed" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">You&apos;re back!</h1>
            <p className="text-gray-600">
              You&apos;ll continue receiving MedJobs updates about job opportunities and profile tips.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="mb-4 text-gray-600">
              We couldn&apos;t process your request. Please try again or contact support.
            </p>
            <button
              onClick={unsubscribe}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-8 border-t border-gray-100 pt-6 text-center">
          <Link href="/medjobs" className="text-sm text-gray-500 hover:text-gray-700">
            Back to MedJobs
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MedJobsUnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
        </div>
      }
    >
      <MedJobsUnsubscribeInner />
    </Suspense>
  );
}
