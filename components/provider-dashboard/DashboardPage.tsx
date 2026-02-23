"use client";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main content skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-xl border border-gray-200 p-6"
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
            <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6">
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
    );
  }

  const meta = metadata as ExtendedMetadata;
  const completeness = calculateProfileCompleteness(profile, meta);

  // Helper to get a specific section's percent
  const sectionPercent = (id: string) =>
    completeness.sections.find((s) => s.id === id)?.percent ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileOverviewCard
            profile={profile}
            completionPercent={sectionPercent("overview")}
          />
          <GalleryCard
            metadata={meta}
            completionPercent={sectionPercent("gallery")}
          />
          <CareServicesCard
            profile={profile}
            completionPercent={sectionPercent("services")}
          />
          <StaffScreeningCard
            metadata={meta}
            completionPercent={sectionPercent("screening")}
          />
          <AboutCard
            profile={profile}
            metadata={meta}
            completionPercent={sectionPercent("about")}
          />
          <PricingCard
            metadata={meta}
            completionPercent={sectionPercent("pricing")}
          />
          <PaymentInsuranceCard
            metadata={meta}
            completionPercent={sectionPercent("payment")}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ProfileCompletenessSidebar
              completeness={completeness}
              lastUpdated={profile.updated_at}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
