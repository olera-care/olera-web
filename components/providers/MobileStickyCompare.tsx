"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
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
  rating,
  reviewCount,
  services,
  highlights,
  similarProviders = [],
  ctaVariant,
  ctaPreviewMode = false,
}: MobileStickyCompareProps) {
  const [visible, setVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Suppression flags (same as other mobile CTAs)
  const [benefitsInView, setBenefitsInView] = useState(false);
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

  // Extract first name from provider name
  const firstName = (() => {
    const cleanName = providerName?.replace(/^\([^)]+\)\s*/, "") || "";
    const rawFirstName = cleanName.split(/\s/)[0] || providerName?.split(/\s/)[0] || "them";
    return rawFirstName.replace(/'s$/i, "") || rawFirstName;
  })();

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
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-gray-900 leading-tight">
                How does {firstName} compare?
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Side by side with {nearbyCount || 2} nearby home{nearbyCount !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={handleCompareClick}
              className="flex-shrink-0 px-6 py-3 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl text-[15px] font-semibold transition-colors"
            >
              Compare
            </button>
          </div>
        </div>
      </div>

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
