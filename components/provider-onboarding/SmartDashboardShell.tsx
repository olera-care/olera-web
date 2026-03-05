"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
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
// Nav Items Configuration
// ============================================================

const NAV_ITEMS = [
  { id: "profile", label: "Profile", href: "/provider" },
  { id: "inbox", label: "Inbox", href: "/provider/inbox" },
  { id: "leads", label: "Leads", href: "/provider/matches" },
  { id: "qna", label: "Q&A", href: "/provider/qna" },
  { id: "reviews", label: "Reviews", href: "/provider/reviews", badge: "New" },
  { id: "pro", label: "Olera Pro", href: "/provider/pro" },
];

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

  // Handle nav click intercept
  const handleNavClick = useCallback(
    (e: React.MouseEvent, navId: string) => {
      e.preventDefault();

      // If wizard is not complete, map nav item to wizard step
      if (!wizardComplete) {
        // Wizard steps: 0=profile, 1=matches (leads), 2=connected-families (final)
        if (navId === "profile") {
          setWizardStep(0);
        } else if (navId === "leads") {
          setWizardStep(1);
        } else {
          // Any other nav item (inbox, qna, reviews, pro) → complete wizard
          setWizardComplete(true);
          setHighlightAction(true);
        }
      } else {
        // Wizard complete - just highlight the action card
        setHighlightAction(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [wizardComplete]
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z"
                  fill="#199087"
                />
                <path
                  d="M22.5 12.5c0 3.59-2.91 6.5-6.5 6.5s-6.5-2.91-6.5-6.5S12.41 6 16 6s6.5 2.91 6.5 6.5z"
                  fill="white"
                />
              </svg>
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>

            {/* Nav Items (Desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`relative px-4 py-2.5 text-sm font-medium rounded-xl transition-all min-h-[44px] ${
                    item.id === "profile"
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold uppercase bg-primary-100 text-primary-700 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link
                href="/for-caregivers"
                className="hidden md:block text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                For caregivers
              </Link>
              <button
                onClick={(e) => handleNavClick(e, "login")}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all min-h-[44px] shadow-sm"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav - horizontal scroll with hidden scrollbar */}
      <div className="md:hidden border-b border-gray-100 bg-white overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div className="flex px-4 py-2.5 gap-1.5 min-w-max">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={(e) => handleNavClick(e, item.id)}
              className={`whitespace-nowrap px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
                item.id === "profile"
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              {item.label}
              {item.badge && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase bg-primary-100 text-primary-700 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Progress Banner */}
        <MobileProgressBanner completeness={completeness} />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content - Cards */}
          <div className="lg:col-span-2 space-y-6">
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
          <div className="hidden lg:block lg:col-span-1">
            <div
              className="sticky top-24"
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
