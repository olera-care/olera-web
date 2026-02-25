"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ProviderStatisticsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [submitted, setSubmitted] = useState(false);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col items-center justify-center text-center min-h-[70vh]">
        {/* Icon — bar chart */}
        <svg className="w-12 h-12 text-primary-500 mb-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>

        {/* Badge */}
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary-600 border border-primary-200 mb-5">
          Coming Soon
        </span>

        {/* Heading */}
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-3">
          Statistics
        </h1>

        <p className="text-base text-gray-500 max-w-sm leading-relaxed mb-8">
          Track how families find and engage with your listing.
        </p>

        {/* Notify form */}
        {!submitted ? (
          <form onSubmit={handleNotify} className="w-full max-w-sm mb-3">
            <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 mr-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
              >
                Notify me
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2.5">
              We&apos;ll send one email when statistics launches. No spam.
            </p>
          </form>
        ) : (
          <div className="mb-8">
            <p className="text-sm text-primary-600 font-medium">
              You&apos;re on the list. We&apos;ll let you know!
            </p>
          </div>
        )}

        {/* Back link */}
        <Link
          href="/provider"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mt-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
