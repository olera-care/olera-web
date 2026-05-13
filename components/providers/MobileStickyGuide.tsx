"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";
import GuideBottomSheet from "./GuideBottomSheet";

interface MobileStickyGuideProps {
  providerName: string;
  providerId: string;
  providerSlug: string;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  priceRange?: string | null;
  /** Pricing tier (3 = Medicare/Medicaid) */
  pricingTier?: number | null;
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
  priceRange,
  pricingTier,
  ctaVariant,
  ctaPreviewMode = false,
}: MobileStickyGuideProps) {
  const { user, activeProfile, openAuth } = useAuth();
  const isLoggedIn = !!user && !!activeProfile;

  // Non-family profile guard (provider, caregiver, student accounts cannot use family CTAs)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMessageSubmitting, setIsMessageSubmitting] = useState(false);

  // Get user email for logged-in flow
  const userEmail = user?.email || "";

  // Suppression flags (same as other mobile CTAs)
  const [benefitsInView, setBenefitsInView] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

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

  // Handle "Message provider" click (logged-in flow)
  // Creates connection via guide-save API, then redirects to inbox
  // NOTE: We intentionally don't track cta_variant_clicked here because logged-in
  // users are already converted and this action shouldn't pollute the A/B test funnel.
  const handleMessageProvider = useCallback(async () => {
    if (!userEmail) return;

    setIsMessageSubmitting(true);

    try {
      // Create connection via guide-save API (handles Slack notifications, lead tracking)
      const res = await fetch("/api/connections/guide-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          provider: {
            id: providerId,
            slug: providerSlug,
            name: providerName,
          },
          sessionId: getOrCreateSessionId(),
        }),
      });

      // Even if there's an error, redirect to inbox (connection may already exist)
      if (!res.ok) {
        console.error("[MobileStickyGuide] guide-save failed:", res.status);
      }

      // Redirect to inbox
      window.location.href = `/portal/inbox`;
    } catch (err) {
      console.error("[MobileStickyGuide] handleMessageProvider error:", err);
      // Still redirect on error - user expects to go to inbox
      window.location.href = `/portal/inbox`;
    }
  }, [userEmail, providerId, providerSlug, providerName]);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    // Reset click tracking so user can open again
    clickFiredRef.current = false;
  }, []);

  // Benefits module suppression
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    let attached: Element | null = null;
    let io: IntersectionObserver | null = null;

    const intersectionCallback = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        setBenefitsInView(entry.intersectionRatio >= 0.5);
      }
    };

    function attach() {
      const el = document.getElementById("benefits");
      if (el === attached) return;
      if (io) {
        io.disconnect();
        io = null;
      }
      setBenefitsInView(false);
      attached = el;
      if (!el) return;
      io = new IntersectionObserver(intersectionCallback, {
        threshold: [0, 0.5, 1],
      });
      io.observe(el);
    }

    attach();

    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            attach();
          })
        : null;
    if (mo) mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (io) io.disconnect();
      if (mo) mo.disconnect();
    };
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

  // Parse price display
  const getPriceDisplay = () => {
    // Medicare/Medicaid tier (tier 3) without explicit pricing
    if (pricingTier === 3 && !priceRange) {
      return { price: "Medicare/Medicaid", subtitle: "may cover this care" };
    }
    if (!priceRange) {
      return { price: "Contact for pricing", subtitle: "Pricing not listed" };
    }
    const isHourly = priceRange.includes("/hr");
    const isMonthly = priceRange.includes("/mo");
    const priceWithoutUnit = priceRange.replace(/\/(hr|mo)$/i, "").trim();

    if (isHourly) {
      return { price: priceWithoutUnit, subtitle: "Estimated hourly cost" };
    }
    if (isMonthly) {
      return { price: priceWithoutUnit, subtitle: "Estimated monthly cost" };
    }
    return { price: priceRange, subtitle: "Estimated cost" };
  };

  const { price, subtitle } = getPriceDisplay();

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
            !benefitsInView && !keyboardOpen
              ? "translate-y-0"
              : "translate-y-full"
          }`}
        >
          <div
            className="bg-white border-t border-gray-200"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="px-5 pt-4 pb-5">
              {/* Info */}
              <div className="mb-4">
                <p className="text-[22px] font-bold text-gray-900 leading-tight">
                  Family account required
                </p>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  To contact care providers
                </p>
              </div>

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
  // RENDER: Logged-in family user - messaging-focused sticky bar
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoggedIn) {
    return (
      <>
        {/* Document-flow spacer */}
        <div
          className="md:hidden"
          aria-hidden="true"
          style={{ height: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
        />

        {/* Sticky bottom bar - Messaging focused (always visible) */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
            !benefitsInView && !keyboardOpen
              ? "translate-y-0"
              : "translate-y-full"
          }`}
        >
          <div
            className="bg-white border-t border-gray-200"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="px-5 pt-4 pb-5">
              {/* Pricing info */}
              <div className="mb-4">
                <p className="text-[22px] font-bold text-gray-900 leading-tight">
                  {price}
                </p>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  {subtitle}
                </p>
              </div>

              {/* Full-width CTA button */}
              <button
                onClick={handleMessageProvider}
                disabled={isMessageSubmitting}
                className="w-full py-4 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 disabled:bg-gray-400 text-white rounded-xl text-[16px] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isMessageSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Message provider</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Guest user - checklist-focused sticky bar
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Document-flow spacer */}
      <div
        className="md:hidden"
        aria-hidden="true"
        style={{ height: "calc(140px + env(safe-area-inset-bottom, 0px))" }}
      />

      {/* Sticky bottom bar (always visible) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          !benefitsInView && !keyboardOpen
            ? "translate-y-0"
            : "translate-y-full"
        }`}
      >
        <div
          className="bg-white border-t border-gray-200"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="px-5 pt-4 pb-5">
            {/* Pricing info */}
            <div className="mb-3">
              <p className="text-[22px] font-bold text-gray-900 leading-tight">
                {price}
              </p>
              <p className="text-[14px] text-gray-500 mt-0.5">
                {subtitle}
              </p>
            </div>

            {/* Checklist value prop */}
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-primary-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-[13px] text-gray-600">Free checklist included</span>
            </div>

            {/* Full-width CTA button */}
            <button
              onClick={handleGuideClick}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl text-[16px] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>Get Checklist</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Guide bottom sheet */}
      <GuideBottomSheet
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        providerId={providerId}
        providerName={providerName}
        providerSlug={providerSlug}
        providerCity={providerCity}
        providerState={providerState}
        providerImage={providerImage}
      />
    </>
  );
}
