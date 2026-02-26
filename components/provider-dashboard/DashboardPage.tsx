"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
} from "@/lib/profile-completeness";
import type { SectionId } from "./edit-modals/types";
import ProfileOverviewCard from "./ProfileOverviewCard";
import GalleryCard from "./GalleryCard";
import CareServicesCard from "./CareServicesCard";
import StaffScreeningCard from "./StaffScreeningCard";
import AboutCard from "./AboutCard";
import PricingCard from "./PricingCard";
import PaymentInsuranceCard from "./PaymentInsuranceCard";
import ProfileCompletenessSidebar from "./ProfileCompletenessSidebar";
import EditOverviewModal from "./edit-modals/EditOverviewModal";
import EditGalleryModal from "./edit-modals/EditGalleryModal";
import EditCareServicesModal from "./edit-modals/EditCareServicesModal";
import EditStaffScreeningModal from "./edit-modals/EditStaffScreeningModal";
import EditAboutModal from "./edit-modals/EditAboutModal";
import EditPricingModal from "./edit-modals/EditPricingModal";
import EditPaymentModal from "./edit-modals/EditPaymentModal";

export default function DashboardPage() {
  const profile = useProviderProfile();
  const { metadata, loading } = useProviderDashboardData(profile);
  const { refreshAccountData } = useAuth();

  // Modal state
  const [editingSection, setEditingSection] = useState<SectionId | null>(null);

  // Loading state
  if (!profile || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main content skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6"
              >
                <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
          {/* Sidebar skeleton */}
          <div className="lg:col-span-1">
            <div className="animate-pulse bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
              <div className="h-5 w-44 bg-gray-200 rounded mb-6" />
              <div className="flex justify-center mb-6">
                <div className="w-[100px] h-[100px] rounded-full bg-gray-100" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  const meta = metadata as ExtendedMetadata;
  const completeness = calculateProfileCompleteness(profile, meta);

  // Helper to get a specific section's percent
  const sectionPercent = (id: string) =>
    completeness.sections.find((s) => s.id === id)?.percent ?? 0;

  return (
    <DashboardContent
      profile={profile}
      meta={meta}
      completeness={completeness}
      sectionPercent={sectionPercent}
      editingSection={editingSection}
      setEditingSection={setEditingSection}
      refreshAccountData={refreshAccountData}
    />
  );
}

// Extracted to a separate component so hooks (useGuidedOnboarding) can be called
// after completeness is computed (hooks can't be called conditionally).
function DashboardContent({
  profile,
  meta,
  completeness,
  sectionPercent,
  editingSection,
  setEditingSection,
  refreshAccountData,
}: {
  profile: NonNullable<ReturnType<typeof useProviderProfile>>;
  meta: ExtendedMetadata;
  completeness: ReturnType<typeof calculateProfileCompleteness>;
  sectionPercent: (id: string) => number;
  editingSection: SectionId | null;
  setEditingSection: (s: SectionId | null) => void;
  refreshAccountData: () => Promise<void>;
}) {
  const guided = useGuidedOnboarding(completeness);

  const handleEdit = useCallback(
    (sectionId: SectionId) => setEditingSection(sectionId),
    [setEditingSection]
  );

  const handleCloseModal = useCallback(() => {
    setEditingSection(null);
    if (guided.isGuidedActive) {
      guided.stopGuided();
    }
  }, [setEditingSection, guided]);

  const handleSaved = useCallback(async () => {
    await refreshAccountData();
    if (guided.isGuidedActive && editingSection) {
      const next = guided.getNextSection(editingSection);
      if (next) {
        setEditingSection(next);
      } else {
        setEditingSection(null);
        guided.stopGuided();
      }
    } else {
      setEditingSection(null);
    }
  }, [refreshAccountData, guided, editingSection, setEditingSection]);

  const handleGuidedBack = useCallback(() => {
    if (editingSection) {
      const prev = guided.getPrevSection(editingSection);
      if (prev) {
        setEditingSection(prev);
      }
    }
  }, [editingSection, guided, setEditingSection]);

  // Shared modal props
  const modalProps = {
    profile,
    metadata: meta,
    onClose: handleCloseModal,
    onSaved: handleSaved,
    guidedMode: guided.isGuidedActive,
    guidedStep: editingSection ? guided.getStepNumber(editingSection) : 1,
    guidedTotal: guided.totalSteps,
    onGuidedBack: editingSection && guided.getPrevSection(editingSection)
      ? handleGuidedBack
      : undefined,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader slug={profile.slug} />

      {/* Guided onboarding banner */}
      {guided.shouldPrompt && !guided.isGuidedActive && (
        <div
          className="mb-6 bg-gradient-to-r from-primary-50 to-vanilla-50 rounded-2xl border border-primary-100/60 p-5 flex items-center justify-between"
          style={{ animation: "card-enter 0.25s ease-out both" }}
        >
          <div>
            <p className="text-[15px] font-semibold text-gray-900">
              Complete your profile to attract more families
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              We&apos;ll guide you through each section step by step.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={guided.dismiss}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                guided.startGuided();
                if (guided.firstIncompleteSection) {
                  setEditingSection(guided.firstIncompleteSection);
                }
              }}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main content — staggered entrance */}
        <div className="lg:col-span-2 space-y-6">
          {[
            <ProfileOverviewCard
              key="overview"
              profile={profile}
              completionPercent={sectionPercent("overview")}
              onEdit={() => handleEdit("overview")}
            />,
            <GalleryCard
              key="gallery"
              metadata={meta}
              completionPercent={sectionPercent("gallery")}
              onEdit={() => handleEdit("gallery")}
            />,
            <CareServicesCard
              key="services"
              profile={profile}
              completionPercent={sectionPercent("services")}
              onEdit={() => handleEdit("services")}
            />,
            <StaffScreeningCard
              key="screening"
              metadata={meta}
              completionPercent={sectionPercent("screening")}
              onEdit={() => handleEdit("screening")}
            />,
            <AboutCard
              key="about"
              profile={profile}
              metadata={meta}
              completionPercent={sectionPercent("about")}
              onEdit={() => handleEdit("about")}
            />,
            <PricingCard
              key="pricing"
              metadata={meta}
              completionPercent={sectionPercent("pricing")}
              onEdit={() => handleEdit("pricing")}
            />,
            <PaymentInsuranceCard
              key="payment"
              metadata={meta}
              completionPercent={sectionPercent("payment")}
              onEdit={() => handleEdit("payment")}
            />,
          ].map((card, i) => (
            <div
              key={i}
              style={{
                animation: "card-enter 0.25s ease-out both",
                animationDelay: `${i * 60}ms`,
              }}
            >
              {card}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div
            className="sticky top-24"
            style={{
              animation: "card-enter 0.25s ease-out both",
              animationDelay: "450ms",
            }}
          >
            <ProfileCompletenessSidebar
              completeness={completeness}
              lastUpdated={profile.updated_at}
            />
          </div>
        </div>
      </div>

      {/* Edit Modals */}
      {editingSection === "overview" && <EditOverviewModal {...modalProps} />}
      {editingSection === "gallery" && <EditGalleryModal {...modalProps} />}
      {editingSection === "services" && <EditCareServicesModal {...modalProps} />}
      {editingSection === "screening" && <EditStaffScreeningModal {...modalProps} />}
      {editingSection === "about" && <EditAboutModal {...modalProps} />}
      {editingSection === "pricing" && <EditPricingModal {...modalProps} />}
      {editingSection === "payment" && <EditPaymentModal {...modalProps} />}
    </div>
    </div>
  );
}

// ── Page header with action buttons ──

function DashboardHeader({ slug }: { slug: string | null }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!slug) return;
    const url = `${window.location.origin}/provider/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">Dashboard</h1>
        <p className="text-[15px] text-gray-500 mt-1">Manage your listing and track your profile</p>
      </div>

      {slug && (
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/provider/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2 shadow-xs hover:bg-gray-50 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Public view
          </Link>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 shadow-sm transition-all duration-200"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share profile
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
