"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getPricingConfig } from "@/lib/pricing-config";
import { useAuth } from "@/components/auth/AuthProvider";
import CompareOverlay from "@/components/providers/CompareOverlay";
import LoggedInFamilyCTA from "@/components/providers/LoggedInFamilyCTA";
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
  highlights?: string[];
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
  highlights,
  similarProviders = [],
  ctaVariant,
  ctaPreviewMode = false,
}: CompareCardProps) {
  const { user, activeProfile, openAuth } = useAuth();
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Check if user is logged in as a family member
  const isLoggedIn = !!user && !!activeProfile;

  // Non-family profile guard (provider, caregiver, student accounts cannot use family CTAs)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");

  // Logged-in family user (not provider/caregiver/student)
  const isLoggedInFamily = isLoggedIn && !isNonFamilyProfile;
  const accountTypeLabel = activeProfile?.type === "organization"
    ? "provider"
    : (activeProfile?.type === "caregiver" || activeProfile?.type === "student")
    ? "caregiver"
    : "current";

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
    highlights,
  };

  // Number of similar providers
  const nearbyCount = Math.min(similarProviders.length, 2);

  // Get pricing unit from category config
  const pricingConfig = providerCategory ? getPricingConfig(providerCategory) : null;
  const priceUnit = pricingConfig?.unit ?? "month";
  const unitLabel = priceUnit === "hour" ? "Hourly" : "Monthly";

  // Build avatar list for stacked display (current + up to 2 similar)
  const avatarProviders = [
    { image: providerImage, name: providerName },
    ...similarProviders.slice(0, 2).map((p) => ({ image: p.image, name: p.name })),
  ];

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

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Non-family profile guard (provider/caregiver/student logged in)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNonFamilyProfile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Price section - consistent with regular view */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Est. {unitLabel} · {providerCity || "Local"}
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {priceRange || "Contact for pricing"}
            </p>
          </div>

          {/* Family account required message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Family account required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Care comparison requests can only be sent from a family account. Create one to compare providers.
          </p>
          <button
            onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create Family Account
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Use a different email than your {accountTypeLabel} account.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Logged-in family user — show LoggedInFamilyCTA directly (no overlay)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoggedInFamily) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          <LoggedInFamilyCTA
            providerId={providerId}
            providerName={providerName}
            providerSlug={providerSlug}
            providerCategory={providerCategory}
            providerCity={providerCity}
            providerState={providerState}
            providerImage={providerImage}
            careTypes={services}
            priceRange={priceRange}
            ctaVariant={ctaVariant || "compare"}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Guest user — show compare button that opens overlay
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Price section */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Est. {unitLabel} · {providerCity || "Local"}
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {/* priceRange already includes suffix like "$1,000 - $2,000/mo" */}
              {priceRange || "Contact for pricing"}
            </p>
          </div>

          {/* Hook line + Headline stack (compact spacing) */}
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">Quick Comparison</span>
          </div>

          {/* Headline */}
          <h3 className="text-2xl font-bold text-gray-900 leading-snug">
            How do they compare?
          </h3>
          <p className="text-[15px] text-gray-500 mt-0.5 mb-5">
            Side by side with {nearbyCount || 2} nearby home{nearbyCount !== 1 ? "s" : ""}
          </p>

          {/* Compare button */}
          <button
            onClick={handleCompareClick}
            className="w-full px-5 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            Compare
          </button>

          {/* Stacked avatars + Find your best fit (left-aligned) */}
          <div className="flex items-center gap-2.5 mt-4">
            <div className="flex -space-x-2">
              {avatarProviders.map((provider, index) => (
                <div
                  key={index}
                  className="w-7 h-7 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm"
                  style={{ zIndex: avatarProviders.length - index }}
                >
                  {provider.image ? (
                    <Image
                      src={provider.image}
                      alt={provider.name || "Provider"}
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-500">
                      {(provider.name || "P").charAt(0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">Find your best fit</span>
          </div>
        </div>
      </div>

      {/* Comparison overlay */}
      <CompareOverlay
        isOpen={overlayOpen}
        onClose={handleCloseOverlay}
        currentProvider={currentProvider}
        similarProviders={similarProviders}
        ctaVariant={ctaVariant}
        ctaPreviewMode={ctaPreviewMode}
      />
    </>
  );
}
