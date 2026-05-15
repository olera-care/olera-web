"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";
import CompareBottomSheet, { type CompareProvider } from "./CompareBottomSheet";

interface MobileStickyCompareProps {
  providerName: string;
  providerId: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerPhone?: string | null;
  providerImage?: string | null;
  priceRange?: string | null;
  /** Pricing tier (3 = Medicare/Medicaid) */
  pricingTier?: number | null;
  /** Pricing disclaimer text for tooltip */
  pricingDisclaimer?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  services?: string[];
  highlights?: string[];
  /** Similar providers to compare against */
  similarProviders?: CompareProvider[];
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

/**
 * Mobile sticky CTA for the "compare" variant.
 * Step 1: Shows "How does [Provider] compare?" with Compare button.
 * Step 2: Opens bottom sheet with horizontal swipeable comparison cards.
 */
export default function MobileStickyCompare({
  providerName,
  providerId,
  providerSlug,
  providerCategory,
  providerCity,
  providerState,
  providerPhone,
  providerImage,
  priceRange,
  pricingTier,
  pricingDisclaimer,
  rating,
  reviewCount,
  services,
  highlights,
  similarProviders = [],
  ctaVariant,
  ctaPreviewMode = false,
}: MobileStickyCompareProps) {
  const { activeProfile, openAuth } = useAuth();

  // Non-family profile guard (provider, caregiver, student accounts cannot use family CTAs)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPricingTooltip, setShowPricingTooltip] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Build current provider object for comparison
  const currentProvider: CompareProvider = {
    id: providerId,
    slug: providerSlug,
    name: providerName,
    image: providerImage,
    category: providerCategory,
    city: providerCity,
    state: providerState,
    rating,
    reviewCount,
    priceRange,
    services,
    highlights,
  };

  // Number of similar providers to show in copy
  const nearbyCount = Math.min(similarProviders.length, 2);

  // Fire analytics when Compare is clicked
  const clickFiredRef = useRef(false);
  const handleCompareClick = useCallback(() => {
    if (!ctaPreviewMode && ctaVariant && !clickFiredRef.current) {
      clickFiredRef.current = true;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: providerSlug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "mobile",
            action: "compare_clicked",
          },
        }),
      }).catch(() => {});
    }
    setSheetOpen(true);
  }, [ctaVariant, ctaPreviewMode, providerSlug]);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    // Reset click tracking so user can open again
    clickFiredRef.current = false;
  }, []);

  // Keyboard suppression
  useEffect(() => {
    function isTypable(target: EventTarget | null): boolean {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT") {
        const type = (target as HTMLInputElement).type;
        return (
          type !== "checkbox" &&
          type !== "radio" &&
          type !== "button" &&
          type !== "submit"
        );
      }
      return tag === "TEXTAREA" || target.isContentEditable;
    }
    function onFocusIn(e: FocusEvent) {
      if (isTypable(e.target)) setKeyboardOpen(true);
    }
    function onFocusOut() {
      requestAnimationFrame(() => {
        if (!isTypable(document.activeElement)) setKeyboardOpen(false);
      });
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Pricing tooltip ref and outside-click handler
  const tooltipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showPricingTooltip) return;

    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (tooltipButtonRef.current && !tooltipButtonRef.current.contains(e.target as Node)) {
        setShowPricingTooltip(false);
      }
    };
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [showPricingTooltip]);

  // Close tooltip when sticky bar hides (benefits in view or keyboard open)
  useEffect(() => {
    if (keyboardOpen && showPricingTooltip) {
      setShowPricingTooltip(false);
    }
  }, [keyboardOpen, showPricingTooltip]);

  // Parse price display - single line format
  const getPriceDisplay = () => {
    // Medicare/Medicaid tier (tier 3) without explicit pricing
    if (pricingTier === 3 && !priceRange) {
      return "Medicare/Medicaid may cover";
    }
    if (!priceRange) {
      return "Contact for pricing";
    }
    const isHourly = priceRange.includes("/hr");
    const isMonthly = priceRange.includes("/mo");

    if (isHourly) {
      return `${priceRange} estimated`;
    }
    if (isMonthly) {
      return `${priceRange} estimated`;
    }
    return `${priceRange} estimated`;
  };

  const priceDisplay = getPriceDisplay();

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Non-family profile (provider/caregiver/student)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNonFamilyProfile) {
    return (
      <>
        {/* Document-flow spacer */}
        <div
          className="md:hidden"
          aria-hidden="true"
          style={{ height: "calc(130px + env(safe-area-inset-bottom, 0px))" }}
        />

        {/* Sticky bottom bar - Family account required (always visible) */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
            !keyboardOpen
              ? "translate-y-0"
              : "translate-y-full"
          }`}
        >
          <div
            className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="px-5 pt-3 pb-4">
              {/* Info */}
              <div className="flex items-center gap-1.5">
                <p className="text-[16px] font-semibold text-gray-900">
                  Family account required
                </p>
              </div>
              <p className="text-[13px] text-gray-500 mt-1 mb-3">
                To contact care providers
              </p>

              {/* Full-width CTA button */}
              <button
                onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-[16px] font-semibold transition-colors"
              >
                Create Family Account
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Regular user (guest or logged-in family)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Document-flow spacer */}
      <div
        className="md:hidden"
        aria-hidden="true"
        style={{ height: "calc(130px + env(safe-area-inset-bottom, 0px))" }}
      />

      {/* Sticky bottom bar (always visible) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          !keyboardOpen
            ? "translate-y-0"
            : "translate-y-full"
        }`}
      >
        <div
          className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="px-5 pt-3 pb-4">
            {/* Pricing info - single line */}
            <div className="flex items-center gap-1.5">
              <p className="text-[16px] font-semibold text-gray-900">
                {priceDisplay}
              </p>
              {pricingDisclaimer && (
                <button
                  ref={tooltipButtonRef}
                  type="button"
                  onClick={() => setShowPricingTooltip((prev) => !prev)}
                  className="p-1 -m-1 flex items-center justify-center text-gray-400 hover:text-gray-500 active:text-gray-600 transition-colors"
                  aria-label="Pricing info"
                  aria-expanded={showPricingTooltip}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Compare context */}
            <p className="text-[13px] text-gray-500 mt-1 mb-3">
              Compare with {nearbyCount || 2} nearby home{nearbyCount !== 1 ? "s" : ""}
            </p>

            {/* Full-width CTA button */}
            <button
              onClick={handleCompareClick}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-[16px] font-semibold transition-colors"
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* ── Pricing tooltip portal ── */}
      {showPricingTooltip &&
        pricingDisclaimer &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed left-4 right-4 z-[100] md:hidden"
            style={{ bottom: "calc(160px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
              <p>{pricingDisclaimer}</p>
            </div>
          </div>,
          document.body
        )}

      {/* Comparison bottom sheet */}
      <CompareBottomSheet
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        currentProvider={currentProvider}
        similarProviders={similarProviders}
        ctaVariant={ctaVariant}
        ctaPreviewMode={ctaPreviewMode}
      />
    </>
  );
}
