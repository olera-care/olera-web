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
 * A refined, non-intrusive toast that nudges guests to sign up.
 * Centered layout with icon on top, stacked buttons on mobile, horizontal on desktop.
 */
export default function SaveNudgeToast({
  savedCount,
  onSignUp,
  onDismiss,
  onAutoDismiss,
}: SaveNudgeToastProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowContent(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(), 250);
  }, [onDismiss]);

  const handleAutoDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => (onAutoDismiss || onDismiss)(), 250);
  }, [onAutoDismiss, onDismiss]);

  const handleSignUp = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onSignUp(), 150);
  }, [onSignUp]);

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    const timer = setTimeout(handleAutoDismiss, 12000);
    return () => clearTimeout(timer);
  }, [handleAutoDismiss]);

  if (!mounted) return null;

  const toast = (
    <div
      className={`
        fixed left-1/2 -translate-x-1/2 z-[100]
        w-[calc(100%-32px)] max-w-[400px]
        bottom-5 sm:bottom-8
        ${isExiting ? "animate-toastExit" : "animate-toastEnter"}
      `}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="alert"
      aria-live="polite"
    >
      {/* Card - Apple/Airbnb style elevation with layered shadows */}
      <div
        className="bg-white rounded-2xl overflow-hidden border border-gray-200/60"
        style={{
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 24px 48px -8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="p-5 pt-6">
          {/* Header: Centered icon on top, centered text below */}
          <div className="flex flex-col items-center gap-3 mb-5">
            {/* Heart icon - brand teal color */}
            <div
              className={`
                w-12 h-12 rounded-full bg-primary-50
                flex items-center justify-center shrink-0
                transition-all duration-500
                ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"}
              `}
            >
              <svg
                className="w-5 h-5 text-primary-500 animate-heartPulse"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {/* Text content - always centered */}
            <div
              className={`
                text-center
                transition-all duration-500 delay-[50ms]
                ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
              `}
            >
              <p className="text-[16px] font-semibold text-gray-900 leading-tight">
                {savedCount} provider{savedCount !== 1 ? "s" : ""} saved
              </p>
              <p className="text-[14px] text-gray-500 mt-0.5">
                Sign up to sync across devices
              </p>
            </div>
          </div>

          {/* Buttons - stacked on mobile, horizontal centered on desktop */}
          <div
            className={`
              flex flex-col-reverse sm:flex-row items-center justify-center gap-2 sm:gap-3
              transition-all duration-500 delay-[100ms]
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <button
              onClick={handleDismiss}
              className="
                py-2 sm:py-2.5 px-4
                text-gray-500 hover:text-gray-700
                text-[14px] font-medium
                transition-colors whitespace-nowrap
              "
            >
              Maybe Later
            </button>
            <button
              onClick={handleSignUp}
              className="
                w-full sm:w-auto py-2.5 px-6
                bg-gray-900 hover:bg-gray-800 active:scale-[0.98]
                text-white text-[14px] font-semibold
                rounded-full transition-all
              "
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
