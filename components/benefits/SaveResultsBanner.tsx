"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import { setDeferredAction } from "@/lib/deferred-action";

export default function SaveResultsBanner() {
  const { user, openAuth } = useAuth();
  const { locationDisplay } = useCareProfile();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is authenticated or banner was dismissed
  if (user || dismissed) return null;

  function handleSignIn() {
    setDeferredAction({
      action: "save_benefit",
      returnUrl: "/benefits/finder",
    });
    openAuth({ defaultMode: "sign-up", intent: "family" });
  }

  // Use location if available, fallback to "your area"
  const locationText = locationDisplay?.trim() || "your area";

  return (
    <div className="relative border border-vanilla-300 bg-vanilla-100 rounded-2xl p-5 sm:p-6 mb-8">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer transition-colors rounded-lg hover:bg-vanilla-200"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Headline */}
      <p className="text-xs font-medium text-gray-400 mb-2 tracking-widest uppercase pr-8">
        Want providers to find you?
      </p>

      {/* Message */}
      <p className="text-sm text-gray-600 leading-relaxed max-w-md mb-4 sm:mb-5">
        Sign in to let qualified providers in {locationText} reach out to you directly. You decide who to talk to.
      </p>

      {/* Action */}
      <button
        onClick={handleSignIn}
        className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-gray-900 text-white rounded-full text-sm font-medium border-none cursor-pointer hover:bg-gray-800 transition-colors"
      >
        Sign in to get matched
      </button>
    </div>
  );
}
