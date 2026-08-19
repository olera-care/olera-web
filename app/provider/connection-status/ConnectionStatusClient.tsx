"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Client component for /provider/connection-status.
 * POSTs the signed token on mount (scanner-safe — link-scanners that fetch
 * every href via GET never write). On success, immediately redirects to dashboard.
 */

interface StatusResponse {
  ok: boolean;
  error?: string;
}

export default function ConnectionStatusClient({ tok }: { tok: string }) {
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return; // strict-mode double-mount guard
    submitted.current = true;

    if (!tok) {
      setError("Invalid or missing link");
      return;
    }

    // POST and redirect immediately on success
    fetch("/api/provider/connection-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tok }),
    })
      .then((res) => res.json().catch(() => ({ ok: false })))
      .then((json: StatusResponse) => {
        if (json.ok) {
          window.location.href = "/provider";
        } else {
          setError(json.error || "Something went wrong");
        }
      })
      .catch(() => {
        setError("Failed to record your response");
      });
  }, [tok]);

  // Error state
  if (error) {
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
            {error === "Token has expired"
              ? "This link has expired. You can still manage your connections from your dashboard."
              : error}
          </p>
          <Link
            href="/provider"
            className="inline-block px-8 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Blank/minimal loading state while POST happens
  return (
    <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );
}
