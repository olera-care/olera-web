"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// SessionStorage keys (must match PostAuthOnboarding)
const MATCHES_ACTIVATED_KEY = "olera_matches_activated";
const MATCHES_CITY_KEY = "olera_matches_city";

/**
 * One-time dismissible banner shown on the browse page after a user
 * opts into Matches during onboarding. Reads from sessionStorage and
 * permanently dismisses when clicked or closed.
 */
export default function MatchesActivatedBanner() {
  const [visible, setVisible] = useState(false);
  const [city, setCity] = useState("your area");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const activated = sessionStorage.getItem(MATCHES_ACTIVATED_KEY);
    if (activated === "true") {
      const storedCity = sessionStorage.getItem(MATCHES_CITY_KEY);
      if (storedCity) setCity(storedCity);
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(MATCHES_ACTIVATED_KEY);
      sessionStorage.removeItem(MATCHES_CITY_KEY);
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-primary-50 to-primary-100/80 border border-primary-200/60 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] text-gray-900">
              Your profile is live — providers in {city} are already looking for families like yours.
            </p>
            <Link
              href="/portal/matches"
              onClick={handleDismiss}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View your Matches profile &rarr;
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
