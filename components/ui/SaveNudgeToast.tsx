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
 * A beautiful, centered toast card that nudges guests to sign up.
 * Airbnb-style with Apple-level polish.
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
        w-[calc(100%-32px)] max-w-[340px]
        bottom-5 sm:bottom-8
        ${isExiting ? "animate-toastExit" : "animate-toastEnter"}
      `}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="alert"
      aria-live="polite"
    >
      {/* Card */}
      <div
        className="bg-white rounded-[20px] overflow-hidden relative"
        style={{
          boxShadow: "0 8px 40px -8px rgba(0, 0, 0, 0.15), 0 2px 12px -2px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Close button - top right */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content - centered */}
        <div className="px-6 pt-7 pb-6 text-center">
          {/* Heart icon */}
          <div
            className={`
              inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 mb-4
              transition-all duration-500
              ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"}
            `}
          >
            <svg
              className="w-6 h-6 text-rose-500 animate-heartPulse"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          {/* Title */}
          <h3
            className={`
              text-[17px] font-semibold text-gray-900 mb-1
              transition-all duration-500 delay-[50ms]
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            {savedCount} provider{savedCount !== 1 ? "s" : ""} saved
          </h3>

          {/* Subtitle */}
          <p
            className={`
              text-[14px] text-gray-500 mb-5
              transition-all duration-500 delay-[100ms]
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            Sign up to sync across all your devices
          </p>

          {/* Buttons - secondary left, primary right (Apple/Airbnb convention) */}
          <div
            className={`
              flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5
              transition-all duration-500 delay-[150ms]
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <button
              onClick={handleDismiss}
              className="
                py-2.5 px-4
                text-gray-500 hover:text-gray-900
                text-[14px] font-medium
                transition-colors
              "
            >
              Maybe Later
            </button>
            <button
              onClick={handleSignUp}
              className="
                w-full sm:w-auto sm:min-w-[140px]
                py-2.5 px-6
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
