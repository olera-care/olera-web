"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribePage() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const res = await fetch("/api/providers/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {status === "done" ? (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              You&apos;ve been unsubscribed
            </h1>
            <p className="text-gray-500 mb-6">
              You will no longer receive lead notification emails from Olera.
              You can re-subscribe at any time from your provider dashboard.
            </p>
            <Link
              href={`/provider/${slug}`}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View your listing
            </Link>
          </>
        ) : status === "error" ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t process your request. Please try again or contact{" "}
              <a href="mailto:support@olera.care" className="text-primary-600 hover:underline">
                support@olera.care
              </a>.
            </p>
            <button
              onClick={handleUnsubscribe}
              className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Unsubscribe from lead emails
            </h1>
            <p className="text-gray-500 mb-6">
              You will stop receiving email notifications when families reach out to your listing on Olera.
              You can re-subscribe at any time.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={status === "loading"}
              className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Processing..." : "Unsubscribe"}
            </button>
            <p className="mt-4 text-xs text-gray-400">
              This only affects lead notification emails. Important account emails will still be sent.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
