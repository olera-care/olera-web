"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ProviderLeadsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [submitted, setSubmitted] = useState(false);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col items-center justify-center text-center min-h-[70vh]">
        {/* Icon — users/people */}
        <svg className="w-12 h-12 text-primary-500 mb-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>

        {/* Badge */}
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary-600 border border-primary-200 mb-5">
          Coming Soon
        </span>

        {/* Heading */}
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-3">
          Leads
        </h1>

        <p className="text-base text-gray-500 max-w-sm leading-relaxed mb-8">
          See who&apos;s interested and manage your connections with families.
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
              We&apos;ll send one email when leads launches. No spam.
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
    </div>
  );
}
