"use client";

import { useState, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Provider } from "@/lib/types/provider";
import type { Profile, OrganizationMetadata } from "@/lib/types";
import { parseProviderImages, getPrimaryImage } from "@/lib/types/provider";
import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
} from "@/lib/profile-completeness";
import { useNavbar } from "@/components/shared/NavbarContext";

// Onboarding components
import ActionCard, { type ActionCardState, type NotificationData } from "./ActionCard";
import PlatformShowcase from "./PlatformShowcase";

// ============================================================
// Onboarding Header (minimal — logo + provider name + back)
// ============================================================

function OnboardingHeader({ providerName }: { providerName: string }) {
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5F0]/80 backdrop-blur-sm border-b border-gray-200/40">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <Image src="/images/olera-logo.png" alt="Olera" width={28} height={28} className="object-contain" />
            <span className="text-lg font-bold text-gray-900">Olera</span>
          </Link>

          {/* Center: Provider name — desktop only */}
          <span className="hidden sm:block text-sm font-medium text-gray-500 truncate max-w-[240px]">
            {providerName}
          </span>

          {/* Back */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-500 rounded-lg hover:text-gray-700 hover:bg-white/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Helper: Convert iOS Provider to Profile shape
// ============================================================

const iosCategoryMap: Record<string, Profile["category"]> = {
  "Home Care (Non-medical)": "home_care_agency",
  "Home Health Care": "home_health_agency",
  "Assisted Living": "assisted_living",
  "Independent Living": "independent_living",
  "Memory Care": "memory_care",
  "Nursing Home": "nursing_home",
  "Hospice": "hospice_agency",
  "Assisted Living | Independent Living": "assisted_living",
  "Memory Care | Assisted Living": "memory_care",
};

function providerToProfile(provider: Provider): Profile {
  const images = parseProviderImages(provider.provider_images);
  const primaryImage = getPrimaryImage(provider);

  const isHourly =
    provider.provider_category === "Home Care (Non-medical)" ||
    provider.provider_category === "Home Health Care";

  const priceRange =
    provider.lower_price != null || provider.upper_price != null
      ? `$${provider.lower_price ?? "?"} - $${provider.upper_price ?? "?"}${isHourly ? "/hr" : "/mo"}`
      : undefined;

  const metadata: OrganizationMetadata & ExtendedMetadata = {
    price_range: priceRange,
    images: images.length > 0 ? images : primaryImage ? [primaryImage] : [],
  };

  const careTypes: string[] = [provider.provider_category];
  if (provider.main_category && provider.main_category !== provider.provider_category) {
    careTypes.push(provider.main_category);
  }

  return {
    id: provider.provider_id,
    account_id: null,
    source_provider_id: provider.provider_id,
    slug: provider.slug || provider.provider_id,
    type: "organization",
    category: iosCategoryMap[provider.provider_category] || "assisted_living",
    display_name: provider.provider_name,
    description: provider.provider_description,
    image_url: primaryImage,
    phone: provider.phone,
    email: provider.email,
    website: provider.website,
    address: provider.address,
    city: provider.city,
    state: provider.state,
    zip: provider.zipcode?.toString() || null,
    lat: provider.lat,
    lng: provider.lon,
    service_area: provider.city && provider.state ? `${provider.city}, ${provider.state}` : null,
    care_types: careTypes,
    metadata,
    claim_state: "unclaimed",
    verification_state: "unverified",
    source: "seeded",
    is_active: !provider.deleted,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================
// Component Props
// ============================================================

interface SmartDashboardShellProps {
  provider: Provider;
  claimSession: string;
  onVerificationComplete: (verifiedEmail?: string) => void;
  /** Initial state for the action card */
  initialActionState?: ActionCardState;
  /** If provided, user came from email campaign link and is pre-verified */
  preVerifiedEmail?: string;
  /** Notification data (lead/review/question) that brought the user here */
  notificationData?: NotificationData | null;
  /** Whether the user is currently signed in */
  isSignedIn?: boolean;
}

// ============================================================
// Main Component
// ============================================================

export default function SmartDashboardShell({
  provider,
  claimSession,
  onVerificationComplete,
  initialActionState = "verify-form",
  preVerifiedEmail,
  notificationData,
  isSignedIn = false,
}: SmartDashboardShellProps) {
  const { setForceHidden } = useNavbar();

  // Convert provider to profile shape for completeness calculation
  const profile = useMemo(() => providerToProfile(provider), [provider]);
  const metadata = profile.metadata as ExtendedMetadata;
  const completeness = useMemo(
    () => calculateProfileCompleteness(profile, metadata),
    [profile, metadata]
  );

  // Action card state
  const isNotificationState = initialActionState?.startsWith("notification-");
  const [actionCardState] = useState<ActionCardState>(
    isNotificationState ? initialActionState : (preVerifiedEmail ? "pre-verified" : initialActionState)
  );

  // Is this a notification-driven entry (lead/question/review from email)?
  // Guard: only treat as notification if we actually have the data to render it.
  // Without notificationData, the ActionCard notification renders would return nothing.
  const isNotificationEntry =
    ["notification-lead", "notification-question", "notification-review"].includes(actionCardState)
    && !!notificationData;

  // Hide main navbar — this page has its own header
  // useLayoutEffect fires before browser paint, preventing a flash of the main nav
  useLayoutEffect(() => {
    setForceHidden(true);
    return () => setForceHidden(false);
  }, [setForceHidden]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14">
      {/* Header */}
      <OnboardingHeader providerName={provider.provider_name} />

      {/* Main Content — narrow, centered */}
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">

        {/* ── Notification Hero (when coming from email) ── */}
        {isNotificationEntry ? (
          <div
            className="mb-10"
            style={{ animation: "card-enter 0.3s ease-out both" }}
          >
            <ActionCard
              provider={provider}
              claimSession={claimSession}
              initialState={actionCardState}
              onVerificationComplete={onVerificationComplete}
              preVerifiedEmail={preVerifiedEmail}
              notificationData={notificationData}
              isSignedIn={isSignedIn}
            />
          </div>
        ) : (
          /* ── Welcome Hero (organic visit, no notification) ── */
          <div
            className="mb-10"
            style={{ animation: "card-enter 0.3s ease-out both" }}
          >
            {/* ActionCard for verification (verify-form, pre-verified, etc.) */}
            <ActionCard
              provider={provider}
              claimSession={claimSession}
              initialState={actionCardState}
              onVerificationComplete={onVerificationComplete}
              preVerifiedEmail={preVerifiedEmail}
              notificationData={notificationData}
              isSignedIn={isSignedIn}
            />
          </div>
        )}

        {/* ── Platform Showcase (static cards, no navigation) ── */}
        <PlatformShowcase
          provider={provider}
          completenessPercent={completeness.overall}
        />
      </div>
    </div>
  );
}
