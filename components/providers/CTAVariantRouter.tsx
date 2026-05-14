"use client";

import { useEffect, useRef } from "react";
import { useCTAVariant, isCTAPreviewMode } from "@/hooks/use-cta-variant";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import ConnectionCardWithRedirect from "@/components/providers/ConnectionCardWithRedirect";
import MobileStickyBottomCTA from "@/components/providers/MobileStickyBottomCTA";
import { CompareCard, GuideCard } from "@/components/providers/cta-variants";
import MobileStickyCompare from "@/components/providers/MobileStickyCompare";
import MobileStickyGuide from "@/components/providers/MobileStickyGuide";
import type { CompareProvider } from "@/components/providers/CompareBottomSheet";

// Props shared by both routers — mirrors ConnectionCardWithRedirect's interface.
export interface CTARouterProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  priceRange: string | null;
  reviewCount: number | undefined;
  phone: string | null;
  acceptedPayments: string[];
  careTypes: string[];
  city?: string | null;
  state?: string | null;
  responseTime: string | null;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  /** Rating for compare variant */
  rating?: number | null;
  /** Highlights for compare variant */
  highlights?: string[];
  /** Similar providers for compare variant */
  similarProviders?: CompareProvider[];
}

// ────────────────────────────────────────────────────────────────────────────
// Impression tracking — fires cta_variant_impression once per session + variant
// ────────────────────────────────────────────────────────────────────────────

function useImpressionTracking(
  variant: string | null,
  surface: "desktop" | "mobile",
  providerSlug: string,
) {
  const firedRef = useRef(false);
  useEffect(() => {
    // Don't fire until variant resolves
    if (!variant) return;
    // Only fire once per mount
    if (firedRef.current) return;
    // Don't fire in preview mode (contaminates A/B data)
    if (isCTAPreviewMode()) return;
    firedRef.current = true;
    // Fire-and-forget POST to the activity tracking endpoint.
    // Using navigator.sendBeacon would be nice but is overkill for an
    // impression that fires on visible render, not page-unload.
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        related_provider_id: providerSlug,
        event_type: "cta_variant_impression",
        session_id: getOrCreateSessionId(),
        metadata: {
          variant,
          surface,
        },
      }),
    }).catch(() => {
      // Swallow — analytics failures shouldn't break the page
    });
  }, [variant, surface, providerSlug]);
}

// ────────────────────────────────────────────────────────────────────────────
// Desktop CTA Router
// ────────────────────────────────────────────────────────────────────────────

/**
 * Replaces direct use of ConnectionCardWithRedirect on the provider
 * detail page's desktop sidebar. Wraps the existing CTA in a router
 * that:
 *   1. Resolves the assigned CTA variant for this session.
 *   2. Fires a cta_variant_impression event on mount.
 *   3. Renders the appropriate CTA component (currently only legacy).
 *
 * When new variants are added, extend the switch statement below.
 */
export function DesktopCTAVariantRouter(props: CTARouterProps) {
  const variant = useCTAVariant();
  useImpressionTracking(variant, "desktop", props.providerSlug);

  // Don't render until variant resolves to prevent flash from legacy → actual variant.
  // The CTA card area will be empty for ~50-100ms on first load, which is less
  // jarring than showing legacy then flipping to compare/guide.
  if (variant === null) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 min-h-[300px] animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const {
    providerId,
    providerName,
    providerSlug,
    priceRange,
    reviewCount,
    phone,
    acceptedPayments,
    careTypes,
    city,
    state,
    responseTime,
    providerCategory,
    providerCity,
    providerState,
    providerImage,
    rating,
    highlights,
    similarProviders,
  } = props;

  const isPreview = isCTAPreviewMode();

  switch (variant ?? "legacy") {
    case "compare":
      return (
        <CompareCard
          providerId={providerId}
          providerName={providerName}
          providerSlug={providerSlug}
          providerCategory={providerCategory}
          providerCity={providerCity}
          providerState={providerState}
          providerPhone={phone}
          providerImage={providerImage}
          priceRange={priceRange}
          rating={rating}
          reviewCount={reviewCount}
          services={careTypes}
          highlights={highlights}
          similarProviders={similarProviders}
          ctaVariant={variant}
          ctaPreviewMode={isPreview}
        />
      );
    case "guide":
      return (
        <GuideCard
          providerId={providerId}
          providerName={providerName}
          providerSlug={providerSlug}
          providerCategory={providerCategory}
          providerCity={providerCity}
          providerState={providerState}
          providerImage={providerImage}
          priceRange={priceRange}
          ctaVariant={variant}
          ctaPreviewMode={isPreview}
        />
      );
    case "legacy":
    default:
      return (
        <ConnectionCardWithRedirect
          providerId={providerId}
          providerName={providerName}
          providerSlug={providerSlug}
          priceRange={priceRange}
          reviewCount={reviewCount}
          phone={phone}
          acceptedPayments={acceptedPayments}
          careTypes={careTypes ?? []}
          city={city}
          state={state}
          responseTime={responseTime}
          providerCategory={providerCategory}
          providerCity={providerCity}
          providerState={providerState}
          ctaVariant={variant}
          ctaSurface="desktop"
          ctaPreviewMode={isPreview}
        />
      );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Mobile CTA Router
// ────────────────────────────────────────────────────────────────────────────

export interface MobileCTARouterProps {
  providerName: string;
  priceRange: string | null;
  providerId: string;
  providerSlug: string;
  reviewCount: number | undefined;
  phone: string | null;
  acceptedPayments: string[];
  careTypes: string[];
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  /** Rating for compare variant */
  rating?: number | null;
  /** Highlights for compare variant */
  highlights?: string[];
  /** Similar providers for compare variant */
  similarProviders?: CompareProvider[];
  /** Pricing tier (3 = Medicare/Medicaid) */
  pricingTier?: number | null;
  /** Pricing disclaimer text for tooltip */
  pricingDisclaimer?: string | null;
}

/**
 * Replaces direct use of MobileStickyBottomCTA on the provider detail
 * page. Same router pattern as the desktop version — resolves variant,
 * fires impression, renders the appropriate mobile CTA.
 */
export function MobileCTAVariantRouter(props: MobileCTARouterProps) {
  const variant = useCTAVariant();
  useImpressionTracking(variant, "mobile", props.providerSlug);

  // Don't render until variant resolves to prevent flash from legacy → actual variant.
  // Show a minimal skeleton that matches the sticky bar dimensions.
  if (variant === null) {
    return (
      <>
        {/* Document-flow spacer (matches actual CTA spacer) */}
        <div
          className="md:hidden"
          aria-hidden="true"
          style={{ height: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
        />
        {/* Skeleton sticky bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div
            className="bg-white border-t border-gray-200 animate-pulse"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="px-5 pt-4 pb-5">
              <div className="h-6 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  const {
    providerName,
    priceRange,
    providerId,
    providerSlug,
    reviewCount,
    phone,
    acceptedPayments,
    careTypes,
    providerCategory,
    providerCity,
    providerState,
    providerImage,
    rating,
    highlights,
    similarProviders,
    pricingTier,
    pricingDisclaimer,
  } = props;

  const isPreview = isCTAPreviewMode();

  switch (variant ?? "legacy") {
    case "compare":
      return (
        <MobileStickyCompare
          providerName={providerName}
          providerId={providerId}
          providerSlug={providerSlug}
          providerCategory={providerCategory}
          providerCity={providerCity}
          providerState={providerState}
          providerPhone={phone}
          providerImage={providerImage}
          priceRange={priceRange}
          pricingTier={pricingTier}
          pricingDisclaimer={pricingDisclaimer}
          rating={rating}
          reviewCount={reviewCount}
          services={careTypes}
          highlights={highlights}
          similarProviders={similarProviders}
          ctaVariant={variant}
          ctaPreviewMode={isPreview}
        />
      );
    case "guide":
      return (
        <MobileStickyGuide
          providerName={providerName}
          providerId={providerId}
          providerSlug={providerSlug}
          providerCity={providerCity}
          providerState={providerState}
          providerImage={providerImage}
          priceRange={priceRange}
          pricingTier={pricingTier}
          pricingDisclaimer={pricingDisclaimer}
          ctaVariant={variant}
          ctaPreviewMode={isPreview}
        />
      );
    case "legacy":
    default:
      return (
        <MobileStickyBottomCTA
          providerName={providerName}
          priceRange={priceRange}
          pricingTier={pricingTier}
          pricingDisclaimer={pricingDisclaimer}
          providerId={providerId}
          providerSlug={providerSlug}
          reviewCount={reviewCount}
          phone={phone}
          acceptedPayments={acceptedPayments}
          careTypes={careTypes ?? []}
          providerCategory={providerCategory}
          providerCity={providerCity}
          providerState={providerState}
          ctaVariant={variant}
          ctaSurface="mobile"
          ctaPreviewMode={isPreview}
        />
      );
  }
}
