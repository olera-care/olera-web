"use client";

import { useState } from "react";
import Link from "next/link";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
} from "@/lib/profile-completeness";
import ProfileOverviewCard from "./ProfileOverviewCard";
import GalleryCard from "./GalleryCard";
import CareServicesCard from "./CareServicesCard";
import StaffScreeningCard from "./StaffScreeningCard";
import AboutCard from "./AboutCard";
import PricingCard from "./PricingCard";
import PaymentInsuranceCard from "./PaymentInsuranceCard";
import ProfileCompletenessSidebar from "./ProfileCompletenessSidebar";

export default function DashboardPage() {
  const profile = useProviderProfile();
  const { metadata, loading } = useProviderDashboardData(profile);

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
                <div className="w-[140px] h-[140px] rounded-full bg-gray-100" />
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

  const cards = [
    <ProfileOverviewCard
      key="overview"
      profile={profile}
      completionPercent={sectionPercent("overview")}
    />,
    <GalleryCard
      key="gallery"
      metadata={meta}
      completionPercent={sectionPercent("gallery")}
    />,
    <CareServicesCard
      key="services"
      profile={profile}
      completionPercent={sectionPercent("services")}
    />,
    <StaffScreeningCard
      key="screening"
      metadata={meta}
      completionPercent={sectionPercent("screening")}
    />,
    <AboutCard
      key="about"
      profile={profile}
      metadata={meta}
      completionPercent={sectionPercent("about")}
    />,
    <PricingCard
      key="pricing"
      metadata={meta}
      completionPercent={sectionPercent("pricing")}
    />,
    <PaymentInsuranceCard
      key="payment"
      metadata={meta}
      completionPercent={sectionPercent("payment")}
    />,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader slug={profile.slug} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main content — staggered entrance */}
        <div className="lg:col-span-2 space-y-6">
          {cards.map((card, i) => (
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
