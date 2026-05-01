"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { SavedProviderEntry } from "@/lib/saved-providers";

interface SaveNudgeToastProps {
  savedCount: number;
  savedProviders: SavedProviderEntry[];
  onSignUp: () => void;
  onDismiss: () => void;
  /** Called when toast auto-dismisses (shouldn't count against dismiss limit) */
  onAutoDismiss?: () => void;
}

const AUTO_DISMISS_MS = 12000;

/**
 * A refined, non-intrusive toast that nudges guests to sign up.
 * Shows stacked provider avatars, loss-aversion copy, and a progress bar.
 */
export default function SaveNudgeToast({
  savedCount,
  savedProviders,
  onSignUp,
  onDismiss,
  onAutoDismiss,
}: SaveNudgeToastProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowContent(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    // Track dismiss event
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "family",
        event_type: "save_nudge_dismissed",
        metadata: { saved_count: savedCount },
      }),
    })
      .then((res) => {
        if (!res.ok) console.error("[save-nudge] dismiss track failed:", res.status);
      })
      .catch((err) => console.error("[save-nudge] dismiss track error:", err));

    setIsExiting(true);
    setTimeout(() => onDismiss(), 250);
  }, [onDismiss, savedCount]);

  const handleAutoDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => (onAutoDismiss || onDismiss)(), 250);
  }, [onAutoDismiss, onDismiss]);

  const handleSignUp = useCallback(() => {
    // Track signup CTA click
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "family",
        event_type: "save_nudge_signup_clicked",
        metadata: { saved_count: savedCount },
      }),
    })
      .then((res) => {
        if (!res.ok) console.error("[save-nudge] signup_clicked track failed:", res.status);
      })
      .catch((err) => console.error("[save-nudge] signup_clicked track error:", err));

    setIsExiting(true);
    setTimeout(() => onSignUp(), 150);
  }, [onSignUp, savedCount]);

  // Progress bar countdown
  useEffect(() => {
    const interval = 50; // Update every 50ms for smooth animation
    const decrement = (interval / AUTO_DISMISS_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss when progress reaches 0
  useEffect(() => {
    if (progress <= 0) {
      handleAutoDismiss();
    }
  }, [progress, handleAutoDismiss]);

  if (!mounted) return null;

  const toast = (
    <div
      className={`
        fixed left-1/2 -translate-x-1/2 z-[100]
        w-[calc(100%-32px)] max-w-[420px]
        bottom-5 sm:bottom-8
        ${isExiting ? "animate-toastExit" : "animate-toastEnter"}
      `}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="alert"
      aria-live="polite"
    >
      {/* Card */}
      <div
        className="bg-white rounded-2xl overflow-hidden border border-gray-200/60"
        style={{
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 24px 48px -8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="p-5">
          {/* Main content row */}
          <div className="flex items-start gap-4">
            {/* Stacked avatars */}
            <div
              className={`
                flex -space-x-2.5 shrink-0 pt-0.5
                transition-all duration-500
                ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"}
              `}
            >
              {savedProviders.slice(0, 3).map((provider, idx) => (
                <ProviderAvatar
                  key={provider.providerId}
                  name={provider.name}
                  image={provider.image}
                  index={idx}
                />
              ))}
            </div>

            {/* Text content */}
            <div
              className={`
                flex-1 min-w-0
                transition-all duration-500 delay-[50ms]
                ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
              `}
            >
              <p className="text-[15px] font-semibold text-gray-900 leading-snug">
                {savedCount === 1
                  ? "Keep your saved provider"
                  : `Keep your ${savedCount} saved providers`}
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
                Sign up to access {savedCount === 1 ? "it" : "them"} on any device, anytime.
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className={`
                shrink-0 p-1 -m-1 text-gray-400 hover:text-gray-600 transition-colors
                ${showContent ? "opacity-100" : "opacity-0"}
              `}
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Buttons - full width on mobile, aligned with text on desktop */}
          {/* Desktop padding: 56px for 1 avatar, 116px for 3 avatars (milestones are 1, 3, 7, 15) */}
          <div
            className={`
              flex items-center justify-between mt-4
              transition-all duration-500 delay-[100ms]
              ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
              ${savedProviders.length === 1 ? "sm:pl-[56px]" : "sm:pl-[116px]"}
            `}
          >
            <button
              onClick={handleSignUp}
              className="
                flex-1 py-2.5 px-5 mr-3
                bg-gray-900 hover:bg-gray-800 active:scale-[0.98]
                text-white text-[14px] font-semibold
                rounded-full transition-all whitespace-nowrap
              "
            >
              Sign up free
            </button>
            <button
              onClick={handleDismiss}
              className="
                shrink-0 py-2.5 px-3
                text-gray-500 hover:text-gray-700
                text-[14px] font-medium
                transition-colors whitespace-nowrap
              "
            >
              Not now
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-300 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}

/** Individual provider avatar with image or initials */
function ProviderAvatar({
  name,
  image,
  index,
}: {
  name: string;
  image: string | null;
  index: number;
}) {
  const [imgError, setImgError] = useState(false);

  // Generate initials from name, fallback to "?" if empty
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  // Stagger z-index so first avatar is on top
  const zIndex = 10 - index;

  // Subtle color variations for initials backgrounds
  const bgColors = [
    "bg-primary-100 text-primary-700",
    "bg-primary-200 text-primary-800",
    "bg-primary-50 text-primary-600",
  ];

  const showInitials = !image || imgError;

  return (
    <div
      className={`
        w-10 h-10 rounded-full border-2 border-white overflow-hidden
        flex items-center justify-center shrink-0
        ${showInitials ? bgColors[index % bgColors.length] : ""}
      `}
      style={{ zIndex }}
    >
      {image && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </div>
  );
}
