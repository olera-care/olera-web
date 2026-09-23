"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ServicesResponse {
  ok: boolean;
  error?: string;
  services?: string[];
}

export default function ServicesConfirmClient({ tok }: { tok: string }) {
  const [result, setResult] = useState<ServicesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;

    if (!tok) {
      setError("Invalid or missing link");
      return;
    }

    fetch("/api/provider/services-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tok }),
    })
      .then((res) => res.json().catch(() => ({ ok: false })))
      .then((json: ServicesResponse) => {
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
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl p-10 shadow-sm text-center">
          <div className="flex items-center justify-center mb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <h1 className="font-semibold text-xl text-gray-900 mb-2">
            Your services have been updated
          </h1>
          <p className="text-gray-500 mb-6 leading-relaxed text-sm">
            These services are now listed on your page. Families searching for them can find you.
          </p>
          {result.services && result.services.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Added to your page</p>
              {result.services.map((service) => (
                <div key={service} className="flex items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-emerald-600 font-bold mr-2">✓</span>
                  <span className="text-sm text-gray-700 font-medium">{service}</span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/provider"
            className="inline-block px-8 py-4 bg-[#198087] text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
          >
            Add more services
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
              ? "This link has expired. Sign in to update your services."
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
