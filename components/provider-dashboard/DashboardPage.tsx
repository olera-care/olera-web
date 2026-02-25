"use client";

import { useState } from "react";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
} from "@/lib/profile-completeness";
import Modal from "@/components/ui/Modal";
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
  const { refreshAccountData } = useAuth();

  // Deletion request state
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [deletionSuccess, setDeletionSuccess] = useState(false);

  const handleRequestDeletion = async () => {
    if (!profile) return;
    setRequestingDeletion(true);
    setDeletionError("");

    try {
      const res = await fetch("/api/portal/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit deletion request");
      }

      setDeletionSuccess(true);
      setShowDeletionModal(false);
      await refreshAccountData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong";
      setDeletionError(msg);
    } finally {
      setRequestingDeletion(false);
    }
  };

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
                className="animate-pulse bg-white rounded-xl border border-gray-100 p-6"
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
            <div className="animate-pulse bg-white rounded-xl border border-gray-100 p-6">
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
      {profile.deletion_requested && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Deletion request pending
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your request to remove this listing is being reviewed. This typically takes 2-3 business days.
            </p>
          </div>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-[15px] text-gray-500 mt-1">Manage your listing and track your profile</p>
      </div>
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
          <div className="sticky top-24 space-y-6">
            <ProfileCompletenessSidebar
              completeness={completeness}
              lastUpdated={profile.updated_at}
            />

            {/* Request Listing Deletion — only for claimed providers */}
            {profile.source_provider_id && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Request Listing Deletion
                    </h4>
                    {profile.deletion_requested || deletionSuccess ? (
                      <div className="mt-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="text-xs font-medium text-amber-700">
                            Under review
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          We&apos;ll review your request within 2-3 business days.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 mt-1">
                          Remove this provider from Olera
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowDeletionModal(true)}
                          className="mt-3 w-full text-sm font-medium text-red-500 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors"
                        >
                          Request Deletion
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deletion Request Modal */}
      <Modal
        isOpen={showDeletionModal}
        onClose={() => {
          setShowDeletionModal(false);
          setDeletionError("");
        }}
        title="Request Listing Deletion"
        size="sm"
      >
        <div>
          <p className="text-sm text-gray-600 mb-4">
            We&apos;ll review your request and remove this listing within 2-3 business days. This cannot be undone.
          </p>
          <ul className="space-y-2 mb-5">
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Your listing will be removed from search results
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Families will no longer find or contact you through Olera
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Review takes 2-3 business days
            </li>
          </ul>

          {deletionError && (
            <div className="mb-4 bg-red-50 text-red-700 px-3 py-2.5 rounded-lg text-sm">
              {deletionError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowDeletionModal(false);
                setDeletionError("");
              }}
              disabled={requestingDeletion}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestDeletion}
              disabled={requestingDeletion}
              className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg px-4 py-2"
            >
              {requestingDeletion ? "Submitting..." : "Request Deletion"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
