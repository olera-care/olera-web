"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Client component for /provider/availability.
 * POSTs the signed token on mount (scanner-safe — link-scanners that fetch
 * every href via GET never write). Shows a confirmation message.
 */

interface AvailabilityResponse {
  ok: boolean;
  error?: string;
  value?: "yes" | "no";
  accepting?: boolean;
}

export default function AvailabilityClient({ tok }: { tok: string }) {
  const [result, setResult] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;

    if (!tok) {
      setError("Invalid or missing link");
      return;
    }

    fetch("/api/provider/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tok }),
    })
      .then((res) => res.json().catch(() => ({ ok: false })))
      .then((json: AvailabilityResponse) => {
        if (json.ok) {
          setResult(json);
        } else {
          setError(json.error || "Something went wrong");
        }
      })
      .catch(() => {
        setError("Failed to record your response");
      });
  }, [tok]);

  // Success state
  if (result) {
    const accepting = result.accepting;
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <h1 className="font-serif text-2xl text-gray-900 mb-3">
            {accepting ? "Great, we\u2019ve updated your page" : "Thanks for letting us know"}
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {accepting
              ? "Families can now see that you\u2019re accepting new clients. This helps them feel confident reaching out."
              : "We\u2019ll check back in a few months in case anything changes."}
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-[#198087] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
          >
            Go to Olera
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isExpired = error === "Token has expired";
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </div>
          <h1 className="font-serif text-2xl text-gray-900 mb-3">That link didn&apos;t work</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {isExpired
              ? "This link has expired. Sign in to update your availability."
              : error}
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-[#198087] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
          >
            {isExpired ? "Go to Olera" : "Go to homepage"}
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );
}
