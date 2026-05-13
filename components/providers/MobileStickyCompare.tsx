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
  /** Pricing tier (3 = Medicare/Medicaid) */
  pricingTier?: number | null;
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
  rating,
  reviewCount,
  services,
  highlights,
  similarProviders = [],
  ctaVariant,
  ctaPreviewMode = false,
}: MobileStickyCompareProps) {
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

            {/* Compare context */}
            <p className="text-[13px] text-gray-600 mb-4">
              Compare with {nearbyCount || 2} nearby home{nearbyCount !== 1 ? "s" : ""}
            </p>

            {/* Full-width CTA button */}
            <button
              onClick={handleCompareClick}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl text-[16px] font-semibold transition-colors"
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
