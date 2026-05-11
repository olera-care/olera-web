"use client";

import { useState, useCallback, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import CompareOverlay from "@/components/providers/CompareOverlay";
import type { CompareProvider } from "@/components/providers/CompareBottomSheet";

interface CompareCardProps {
  providerId: string;
  providerName: string;
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
  similarProviders?: CompareProvider[];
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

/**
 * Desktop CTA card for the "compare" variant.
 * Shows pricing info and "Compare" button.
 * Opens full-height overlay on click.
 */
export default function CompareCard({
  providerId,
  providerName,
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
  similarProviders = [],
  ctaVariant,
  ctaPreviewMode = false,
}: CompareCardProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Build current provider object
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
  };

  // Extract first name
  const firstName = (() => {
    const cleanName = providerName?.replace(/^\([^)]+\)\s*/, "") || "";
    return cleanName.split(/\s/)[0] || providerName?.split(/\s/)[0] || "Provider";
  })();

  // Number of similar providers
  const nearbyCount = Math.min(similarProviders.length, 2);

  // Fire analytics
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
            surface: "desktop",
            action: "compare_clicked",
          },
        }),
      }).catch(() => {});
    }
    setOverlayOpen(true);
  }, [ctaVariant, ctaPreviewMode, providerSlug]);

  const handleCloseOverlay = useCallback(() => {
    setOverlayOpen(false);
    clickFiredRef.current = false;
  }, []);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Price section */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Est. Monthly · {providerCity || "Local"}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {priceRange || "Contact for pricing"}
              {priceRange && <span className="text-base font-normal text-gray-500">/mo</span>}
            </p>
          </div>

          {/* Headline */}
          <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
            {firstName} next to {nearbyCount || 2} nearby homes.
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Reviews, pricing, services — side by side.
          </p>

          {/* Compare button */}
          <button
            onClick={handleCompareClick}
            className="w-full px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            Compare
          </button>
        </div>
      </div>

      {/* Comparison overlay */}
      <CompareOverlay
        isOpen={overlayOpen}
        onClose={handleCloseOverlay}
        currentProvider={currentProvider}
        similarProviders={similarProviders}
      />
    </>
  );
}
