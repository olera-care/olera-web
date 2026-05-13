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
  ctaVariant,
  ctaPreviewMode = false,
}: MobileStickyGuideProps) {
  const { user, activeProfile, openAuth } = useAuth();
  const isLoggedIn = !!user && !!activeProfile;

  // Non-family profile guard (provider, caregiver, student accounts cannot use family CTAs)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");

  const [visible, setVisible] = useState(false);
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
  }, [userEmail, providerId, providerSlug, providerName, ctaVariant, ctaPreviewMode]);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    // Reset click tracking so user can open again
    clickFiredRef.current = false;
  }, []);

  // Scroll visibility with hysteresis
  const handleScroll = useCallback(() => {
    setVisible((prev) => {
      if (window.scrollY > 100) return true;
      if (window.scrollY < 30) return false;
      return prev;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Non-family profile (provider/caregiver/student) - hide sticky bar
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNonFamilyProfile) {
    return (
      <>
        {/* Document-flow spacer */}
        <div
          className="md:hidden"
          aria-hidden="true"
          style={{ height: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
        />

        {/* Sticky bottom bar - Family account required */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
            visible && !benefitsInView && !keyboardOpen
              ? "translate-y-0"
              : "translate-y-full"
          }`}
        >
          <div
            className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Heart icon */}
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-700 leading-tight">
                  Family account required
                </p>
                <p className="text-[12px] text-gray-500 leading-tight">
                  To contact providers
                </p>
              </div>

              <button
                onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
                className="flex-shrink-0 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-[14px] font-semibold transition-colors"
              >
                Create Account
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
          style={{ height: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
        />

        {/* Sticky bottom bar - Messaging focused */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
            visible && !benefitsInView && !keyboardOpen
              ? "translate-y-0"
              : "translate-y-full"
          }`}
        >
          <div
            className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Provider info with pricing */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 leading-tight">
                  {providerCity || "Local"} · Est. Monthly
                </p>
                <p className="text-[15px] font-semibold text-gray-900 leading-tight mt-0.5">
                  {priceRange || "Contact for pricing"}
                </p>
              </div>

              <button
                onClick={handleMessageProvider}
                disabled={isMessageSubmitting}
                className="flex-shrink-0 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 disabled:bg-gray-400 text-white rounded-xl text-[14px] font-semibold transition-colors flex items-center gap-1.5"
              >
                {isMessageSubmitting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>...</span>
                  </>
                ) : (
                  <>
                    Message
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
        style={{ height: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
      />

      {/* Sticky bottom bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          visible && !benefitsInView && !keyboardOpen
            ? "translate-y-0"
            : "translate-y-full"
        }`}
      >
        <div
          className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center gap-4 px-4 py-3.5">
            {/* PDF icon */}
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 leading-tight">
                Free Checklist
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 leading-tight">
                Questions to ask & costs
              </p>
            </div>

            <button
              onClick={handleGuideClick}
              className="flex-shrink-0 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl text-[14px] font-semibold transition-colors flex items-center gap-1.5"
            >
              Get Checklist
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
