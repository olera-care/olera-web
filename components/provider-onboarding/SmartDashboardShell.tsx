"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Provider } from "@/lib/types/provider";
import type { Profile, OrganizationMetadata } from "@/lib/types";
import { parseProviderImages, getPrimaryImage } from "@/lib/types/provider";
import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
} from "@/lib/profile-completeness";

// Dashboard card components (reused in preview mode)
import ProfileOverviewCard from "@/components/provider-dashboard/ProfileOverviewCard";
import GalleryCard from "@/components/provider-dashboard/GalleryCard";
import CareServicesCard from "@/components/provider-dashboard/CareServicesCard";
import StaffScreeningCard from "@/components/provider-dashboard/StaffScreeningCard";
import AboutCard from "@/components/provider-dashboard/AboutCard";
import PricingCard from "@/components/provider-dashboard/PricingCard";
import PaymentInsuranceCard from "@/components/provider-dashboard/PaymentInsuranceCard";
import ProfileCompletenessSidebar from "@/components/provider-dashboard/ProfileCompletenessSidebar";

// Onboarding components
import OnboardingWizard from "./OnboardingWizard";
import ActionCard, { type ActionCardState } from "./ActionCard";

// ============================================================
// Mobile Progress Banner (matches DashboardPage)
// ============================================================

function MobileProgressBanner({
  completeness,
}: {
  completeness: ReturnType<typeof calculateProfileCompleteness>;
}) {
  const completedCount = completeness.sections.filter(
    (s) => s.percent >= 100
  ).length;
  const totalSections = completeness.sections.length;

  return (
    <div className="lg:hidden w-full mb-5 bg-white rounded-xl border border-gray-200/80 shadow-sm px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Progress ring */}
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="16" fill="none"
              stroke="#199087"
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${completeness.overall * 1.005} 100.5`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
            {completeness.overall}%
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Profile completeness</p>
          <p className="text-xs text-gray-500">{completedCount} of {totalSections} sections</p>
        </div>

        {/* Info icon (non-interactive in preview) */}
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
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
    community_score: provider.community_Score || undefined,
    value_score: provider.value_score || undefined,
    info_score: provider.information_availability_score || undefined,
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
  onVerificationComplete: () => void;
  /** Initial state for the action card */
  initialActionState?: ActionCardState;
  /** If provided, user came from email campaign link and is pre-verified */
  preVerifiedEmail?: string;
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
}: SmartDashboardShellProps) {
  // Convert provider to profile shape
  const profile = useMemo(() => providerToProfile(provider), [provider]);
  const metadata = profile.metadata as ExtendedMetadata;

  // Calculate completeness from public data
  const completeness = useMemo(
    () => calculateProfileCompleteness(profile, metadata),
    [profile, metadata]
  );

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardComplete, setWizardComplete] = useState(
    // Skip wizard if already showing verification states
    initialActionState !== "verify-form" || !!preVerifiedEmail
  );
  const [highlightAction, setHighlightAction] = useState(false);

  // Action card state - derived from initial + wizard completion
  const [actionCardState, setActionCardState] = useState<ActionCardState>(
    preVerifiedEmail ? "pre-verified" : initialActionState
  );

  // Handle wizard completion
  const handleWizardComplete = useCallback(() => {
    setWizardComplete(true);
  }, []);

  // Reset highlight after animation
  useEffect(() => {
    if (highlightAction) {
      const timer = setTimeout(() => setHighlightAction(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightAction]);

  // Helper to get section completion percent
  const sectionPercent = (id: string) =>
    completeness.sections.find((s) => s.id === id)?.percent ?? 0;

  // Determine which elements are highlighted based on wizard step
  const isSidebarHighlighted = !wizardComplete && wizardStep === 0;
  const isWizardActive = !wizardComplete;

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Progress Banner */}
        <MobileProgressBanner completeness={completeness} />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content - Cards */}
          <div className={`lg:col-span-2 space-y-6 ${isWizardActive ? "opacity-40 blur-[2px]" : ""}`}>
            {/* Action Card - TOP OF LEFT COLUMN */}
            <ActionCard
              provider={provider}
              claimSession={claimSession}
              initialState={actionCardState}
              onVerificationComplete={onVerificationComplete}
              preVerifiedEmail={preVerifiedEmail}
              highlighted={highlightAction}
            />

            {/* Preview Mode Banner */}
            <div
              className="bg-gradient-to-r from-primary-50 to-vanilla-50 border border-primary-100/60 rounded-2xl p-5 flex items-start gap-4"
              style={{ animation: "card-enter 0.25s ease-out both", animationDelay: "60ms" }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 border border-primary-100/60">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 mb-0.5">
                  Preview Mode
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This is how your dashboard will look. Complete verification above to make changes.
                </p>
              </div>
            </div>

            {/* Dashboard Cards */}
            {[
              <ProfileOverviewCard
                key="overview"
                profile={profile}
                completionPercent={sectionPercent("overview")}
                onEdit={undefined}
              />,
              <GalleryCard
                key="gallery"
                metadata={metadata}
                completionPercent={sectionPercent("gallery")}
                onEdit={undefined}
              />,
              <CareServicesCard
                key="services"
                profile={profile}
                completionPercent={sectionPercent("services")}
                onEdit={undefined}
              />,
              <StaffScreeningCard
                key="screening"
                metadata={metadata}
                completionPercent={sectionPercent("screening")}
                onEdit={undefined}
              />,
              <AboutCard
                key="about"
                profile={profile}
                metadata={metadata}
                completionPercent={sectionPercent("about")}
                onEdit={undefined}
              />,
              <PricingCard
                key="pricing"
                metadata={metadata}
                completionPercent={sectionPercent("pricing")}
                onEdit={undefined}
              />,
              <PaymentInsuranceCard
                key="payment"
                metadata={metadata}
                completionPercent={sectionPercent("payment")}
                onEdit={undefined}
              />,
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  animation: "card-enter 0.25s ease-out both",
                  animationDelay: `${(i + 2) * 60}ms`,
                }}
              >
                {card}
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div
            data-wizard-target="sidebar"
            className={`hidden lg:block lg:col-span-1 ${isWizardActive && !isSidebarHighlighted ? "opacity-40 blur-[2px]" : ""} ${isSidebarHighlighted ? "relative z-50" : ""}`}
          >
            <div
              className={`sticky top-24 ${isSidebarHighlighted ? "ring-2 ring-primary-400 ring-offset-4 rounded-2xl" : ""}`}
              style={{
                animation: "card-enter 0.25s ease-out both",
                animationDelay: "540ms",
              }}
            >
              <ProfileCompletenessSidebar
                completeness={completeness}
                lastUpdated={profile.updated_at}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Wizard (only when wizard not complete) */}
      {!wizardComplete && (
        <OnboardingWizard
          step={wizardStep}
          onNext={() => {
            if (wizardStep < 2) {
              setWizardStep(wizardStep + 1);
            } else {
              handleWizardComplete();
            }
          }}
          onComplete={handleWizardComplete}
        />
      )}
    </div>
  );
}
