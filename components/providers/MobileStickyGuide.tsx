"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import GuideBottomSheet from "./GuideBottomSheet";

interface MobileStickyGuideProps {
  providerName: string;
  providerId: string;
  providerSlug: string;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  careTypes?: string[];
  priceRange?: string | null;
  /** Pricing tier (3 = Medicare/Medicaid) */
  pricingTier?: number | null;
  /** Pricing disclaimer text for tooltip */
  pricingDisclaimer?: string | null;
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

/**
 * Mobile sticky CTA for the "guide" variant.
 * Shows a sticky bar with "Get the guide ↓" button.
 * Opens bottom sheet on click for email capture.
 */
export default function MobileStickyGuide({
  providerName,
  providerId,
  providerSlug,
  providerCity,
  providerState,
  providerImage,
  careTypes = [],
  priceRange,
  pricingTier,
  pricingDisclaimer,
  ctaVariant,
  ctaPreviewMode = false,
}: MobileStickyGuideProps) {
  const router = useRouter();
  const { user, activeProfile, openAuth } = useAuth();
  const { isSaved, toggleSave } = useSavedProviders();

  // Non-family profile guard (provider, caregiver, student accounts cannot use family CTAs)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");
  const isLoggedInFamily = !!user && !!activeProfile && !isNonFamilyProfile;
  const userEmail = user?.email || "";

  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPricingTooltip, setShowPricingTooltip] = useState(false);
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // ── Logged-in family user: direct action from sticky bar ──
  const providerIsSaved = isSaved(providerId);
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");

  const handleDirectSave = useCallback(() => {
    toggleSave({
      providerId,
      slug: providerSlug,
      name: providerName,
      location: locationStr,
      careTypes: careTypes,
      image: providerImage || null,
    });
  }, [toggleSave, providerId, providerSlug, providerName, locationStr, careTypes, providerImage]);

  const handleDirectRequest = useCallback(async () => {
    if (!userEmail || directSubmitting) return;

    setDirectSubmitting(true);
    setDirectError(null);

    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          providerName,
          providerSlug,
          intentData: {
            careRecipient: null,
            careType: null,
            urgency: null,
          },
          session_id: getOrCreateSessionId(),
          cta_variant: ctaVariant || "guide",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[MobileStickyGuide] direct request failed:", data.error);
        setDirectError(data.error || "Something went wrong. Please try again.");
        setDirectSubmitting(false);
        return;
      }

      // Dispatch event for inbox refresh
      window.dispatchEvent(new CustomEvent("olera:connection-created"));

      // Go directly to inbox
      if (data.connectionId) {
        router.push(`/portal/inbox?id=${data.connectionId}`);
      } else {
        router.push("/portal/inbox");
      }
    } catch (err) {
      console.error("[MobileStickyGuide] direct request error:", err);
      setDirectError("Something went wrong. Please try again.");
      setDirectSubmitting(false);
    }
  }, [userEmail, directSubmitting, providerId, providerName, providerSlug, ctaVariant, router]);

  // Fire analytics when "Get the checklist" is clicked (guest flow)
  const clickFiredRef = useRef(false);
  const handleGuideClick = useCallback(() => {
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
            action: "guide_clicked",
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
          style={{ height: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
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
              {/* Pricing info - single line */}
              <div className="flex items-center gap-1.5 mb-3">
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

              {/* Family account required text */}
              <p className="text-[13px] text-gray-500 font-medium mb-3">
                Family account required
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

        {/* ── Pricing tooltip portal ── */}
        {showPricingTooltip &&
          pricingDisclaimer &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed left-4 right-4 z-[100] md:hidden"
              style={{ bottom: "calc(140px + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
                <p>{pricingDisclaimer}</p>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Default sticky bar
  // - Logged-in family: direct action [♡] + [Request details]
  // - Guest: "Get free checklist" opens bottom sheet
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Document-flow spacer */}
      <div
        className="md:hidden"
        aria-hidden="true"
        style={{ height: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
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
            <div className="flex items-center gap-1.5 mb-3">
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

            {/* ── Logged-in family: direct action (no sheet needed) ── */}
            {isLoggedInFamily ? (
              <div>
                {/* Error message */}
                {directError && (
                  <p className="text-sm text-red-600 text-center mb-2">{directError}</p>
                )}
                <div className="flex items-center gap-2">
                  {/* Save button */}
                  <button
                  type="button"
                  onClick={handleDirectSave}
                  disabled={directSubmitting}
                  className={`shrink-0 w-14 h-14 flex items-center justify-center rounded-xl border-2 transition-all ${
                    providerIsSaved
                      ? "border-primary-500 bg-primary-50 text-primary-600"
                      : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500"
                  } disabled:opacity-50`}
                  aria-label={providerIsSaved ? "Saved" : "Save for later"}
                >
                  {providerIsSaved ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>

                {/* Primary CTA - direct to inbox */}
                <button
                  type="button"
                  onClick={handleDirectRequest}
                  disabled={directSubmitting}
                  className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[16px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {directSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Request details</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
                </div>
              </div>
            ) : (
              /* ── Guest: opens sheet for checklist + email capture ── */
              <button
                onClick={handleGuideClick}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-[16px] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>Get free checklist</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}
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
            style={{ bottom: "calc(150px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
              <p>{pricingDisclaimer}</p>
            </div>
          </div>,
          document.body
        )}

      {/* Guide bottom sheet - handles logged-in vs guest distinction */}
      <GuideBottomSheet
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        providerId={providerId}
        providerName={providerName}
        providerSlug={providerSlug}
        providerCity={providerCity}
        providerState={providerState}
        providerImage={providerImage}
        careTypes={careTypes}
        priceRange={priceRange}
        ctaVariant={ctaVariant}
      />
    </>
  );
}
