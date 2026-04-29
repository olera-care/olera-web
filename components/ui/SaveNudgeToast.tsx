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
 * after saving providers. Apple/Airbnb quality with spring animations.
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
    // Staggered content entrance
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Manual dismiss (user clicked "Later" or X) - counts against dismiss limit
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 250);
  }, [onDismiss]);

  // Auto-dismiss (timeout) - does NOT count against dismiss limit
  const handleAutoDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      (onAutoDismiss || onDismiss)();
    }, 250);
  }, [onAutoDismiss, onDismiss]);

  const handleSignUp = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onSignUp();
    }, 150);
  }, [onSignUp]);

  // Auto-dismiss after 12 seconds
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
        w-[calc(100%-24px)] max-w-[380px]
        bottom-4 sm:bottom-6
        ${isExiting ? "animate-toastExit" : "animate-toastEnter"}
      `}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Card — clean white with refined shadow */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.12), 0 8px 48px -8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start gap-3.5 mb-3.5">
            {/* Animated heart icon */}
            <div
              className={`
                w-10 h-10 rounded-full bg-gray-100
                flex items-center justify-center shrink-0
                transition-all duration-500
                ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-75"}
              `}
            >
              <svg
                className="w-5 h-5 text-rose-500 animate-heartPulse"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {/* Text content */}
            <div
              className={`
                flex-1 min-w-0 pt-0.5
                transition-all duration-500 delay-75
                ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
              `}
            >
              <p className="text-[15px] font-semibold text-gray-900 leading-tight">
                {savedCount} provider{savedCount !== 1 ? "s" : ""} saved
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5">
                On this device only
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className={`
                w-8 h-8 -mt-1 -mr-1 flex items-center justify-center
                rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100
                transition-all duration-200
                ${showContent ? "opacity-100" : "opacity-0"}
              `}
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Value prop */}
          <p
            className={`
              text-[14px] text-gray-600 leading-relaxed mb-4
              transition-all duration-500 delay-100
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            Create a free account to sync across devices.
          </p>

          {/* Action buttons — black primary, refined secondary */}
          <div
            className={`
              flex items-center gap-2.5
              transition-all duration-500 delay-150
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <button
              onClick={handleSignUp}
              className="
                flex-1 py-2.5 px-5
                bg-gray-900 hover:bg-gray-800 active:bg-gray-950
                text-white text-[14px] font-medium
                rounded-xl transition-colors
              "
            >
              Sign Up Free
            </button>
            <button
              onClick={handleDismiss}
              className="
                py-2.5 px-4
                text-gray-500 hover:text-gray-900
                text-[14px] font-medium
                transition-colors
              "
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
