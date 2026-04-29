"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface SaveNudgeToastProps {
  savedCount: number;
  onSignUp: () => void;
  onDismiss: () => void;
  /** Called when toast auto-dismisses (shouldn't count against dismiss limit) */
  onAutoDismiss?: () => void;
}

/**
 * A beautiful, non-intrusive floating toast that nudges guests to sign up
 * after saving providers. Designed to be Apple/Airbnb quality.
 */
export default function SaveNudgeToast({
  savedCount,
  onSignUp,
  onDismiss,
  onAutoDismiss,
}: SaveNudgeToastProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manual dismiss (user clicked "Maybe Later" or X) - counts against dismiss limit
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match slideDown animation duration
  }, [onDismiss]);

  // Auto-dismiss (timeout) - does NOT count against dismiss limit
  const handleAutoDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      // Use onAutoDismiss if provided (doesn't record dismiss), otherwise fall back
      (onAutoDismiss || onDismiss)();
    }, 300);
  }, [onAutoDismiss, onDismiss]);

  const handleSignUp = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onSignUp();
    }, 200);
  }, [onSignUp]);

  // Auto-dismiss after 12 seconds (doesn't count as user dismiss)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoDismiss();
    }, 12000);
    return () => clearTimeout(timer);
  }, [handleAutoDismiss]);

  if (!mounted) return null;

  const toast = (
    <div
      className={`
        fixed left-1/2 -translate-x-1/2 z-[100]
        w-[calc(100%-24px)] max-w-[400px]
        bottom-4 sm:bottom-6
        ${isExiting ? "animate-slideDown" : "animate-slideUp"}
      `}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Card container — glassmorphism with subtle shadow */}
      <div
        className="
          bg-white/95 backdrop-blur-xl
          rounded-2xl
          shadow-lg
          border border-white/60
          overflow-hidden
        "
        style={{
          boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="px-5 pt-5 pb-5">
          {/* Header with icon and dismiss */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {/* Heart icon — subtle tint, no heavy circle */}
              <svg
                className="w-6 h-6 text-primary-400 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <div>
                <p className="text-[15px] font-semibold text-gray-900 leading-snug">
                  {savedCount} provider{savedCount !== 1 ? "s" : ""} saved
                </p>
                <p className="text-[13px] text-gray-500 leading-snug">
                  On this device only
                </p>
              </div>
            </div>

            {/* Dismiss button — minimal */}
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-colors -mt-0.5 -mr-1"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Value proposition — concise */}
          <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
            Create a free account to sync across devices.
          </p>

          {/* Action buttons — refined, not loud */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignUp}
              className="flex-1 py-2.5 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 text-[14px] font-medium rounded-xl transition-colors"
            >
              Sign Up Free
            </button>
            <button
              onClick={handleDismiss}
              className="py-2.5 px-4 text-gray-500 hover:text-gray-700 text-[14px] transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
