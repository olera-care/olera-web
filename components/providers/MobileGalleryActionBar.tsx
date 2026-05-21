"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders, type SaveProviderData } from "@/hooks/use-saved-providers";

interface MobileGalleryActionBarProps {
  provider: SaveProviderData;
}

/**
 * Mobile-only save button overlay on the hero gallery.
 * Shows only the heart (save) button in the top-right corner.
 * Back button has been moved to MobileProviderTopNav for a cleaner image.
 */
export default function MobileGalleryActionBar({ provider }: MobileGalleryActionBarProps) {
  const { activeProfile, openAuth } = useAuth();
  const { isSaved, toggleSave } = useSavedProviders();
  // Use slug for save check to match header SaveButton and CTA components
  const saved = isSaved(provider.slug);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const heartButtonRef = useRef<HTMLButtonElement>(null);

  // Check if user is a non-family profile
  const isNonFamilyProfile = activeProfile && activeProfile.type !== "family";

  // Dynamic label for account type hint
  const accountTypeLabel = activeProfile?.type === "organization"
    ? "provider"
    : (activeProfile?.type === "caregiver" || activeProfile?.type === "student")
    ? "caregiver"
    : "current";

  // Close tooltip on click outside
  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        heartButtonRef.current &&
        !heartButtonRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip]);

  const btnClass =
    "w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center active:bg-white transition-colors shadow-md";

  return (
    <div
      className="absolute top-4 right-4 z-40 pointer-events-none md:hidden"
    >
      {/* Save button only - clean top-right position */}
      <div className="pointer-events-auto relative">
        <button
          ref={heartButtonRef}
          onClick={() => {
            if (isNonFamilyProfile) {
              setShowTooltip(true);
              return;
            }
            // Use slug as providerId to match header SaveButton and CTA components
            toggleSave({ ...provider, providerId: provider.slug });
          }}
          className={btnClass}
          aria-label={saved ? "Unsave" : "Save"}
        >
          <svg
            className={`w-5 h-5 ${saved ? "text-primary-600" : "text-gray-700"}`}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Tooltip for non-family users */}
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute top-12 right-0 z-50 w-64 bg-gray-900 text-white rounded-xl shadow-lg p-3 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <p className="text-sm mb-2">
              Save providers with a family account.
            </p>
            <button
              onClick={() => {
                setShowTooltip(false);
                openAuth({ defaultMode: "sign-up", intent: "family" });
              }}
              className="text-sm font-medium text-primary-300 hover:text-primary-200 hover:underline"
            >
              Create one →
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Use a different email than your {accountTypeLabel} account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
