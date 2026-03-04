"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ProviderQnAPage() {
  const { user } = useAuth();
  const providerProfile = useProviderProfile();
  const [email, setEmail] = useState(user?.email || "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: dbError } = await supabase.from("feature_waitlist").upsert(
          { feature: "qna", email: email.trim(), profile_id: providerProfile?.id || null },
          { onConflict: "feature,email" },
        );
        if (dbError) throw dbError;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col items-center justify-center text-center min-h-[70vh]">
        {/* Icon — question mark circle */}
        <svg className="w-12 h-12 text-primary-500 mb-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>

        {/* Badge */}
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary-600 border border-primary-200 mb-5">
          Coming Soon
        </span>

        {/* Heading */}
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-3">
          Questions & Answers
        </h1>

        <p className="text-base text-gray-500 max-w-sm leading-relaxed mb-8">
          Answer questions from families and showcase your expertise.
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
                className="flex-1 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 mr-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
              >
                {submitting ? "..." : "Notify me"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2.5">
              We&apos;ll send one email when Questions & Answers launches. No spam.
            </p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
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
