"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import ScheduleInterviewModal, { ScheduleFormData } from "@/components/medjobs/ScheduleInterviewModal";

const SCHEDULE_STORAGE_KEY = "medjobs_schedule_draft";

export default function ContactSection({
  studentId,
  studentName,
  studentEmail,
  studentPhone,
  studentSlug,
  variant = "sidebar",
}: {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  studentSlug: string;
  variant?: "sidebar" | "sticky" | "inline";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, activeProfile, profiles } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [savedFormData, setSavedFormData] = useState<ScheduleFormData | undefined>();

  // Only organization profiles are providers (caregivers are job-seekers)
  const hasProviderProfile = profiles.some((p) => p.type === "organization");

  // Check if caregiver is viewing their own profile
  const ownCaregiverProfile = profiles.find(
    (p) => (p.type === "student" || p.type === "caregiver") && p.slug === studentSlug
  );
  const isViewingOwnProfile = !!ownCaregiverProfile;

  // Auto-open modal after returning from onboarding with ?schedule=pending
  const hasHandledPending = useRef(false);
  useEffect(() => {
    // Only run once to avoid infinite loops
    if (hasHandledPending.current) return;

    const schedulePending = searchParams.get("schedule");
    if (schedulePending === "pending" && user && hasProviderProfile) {
      hasHandledPending.current = true;

      // Clear the query param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("schedule");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });

      // Load saved form data from sessionStorage
      try {
        const saved = sessionStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ScheduleFormData & { candidateSlug: string };
          // Only use if it matches this candidate
          if (parsed.candidateSlug === studentSlug) {
            setSavedFormData(parsed);
          }
          sessionStorage.removeItem(SCHEDULE_STORAGE_KEY);
        }
      } catch {
        // Ignore parse errors
      }

      // Open modal to complete scheduling
      setShowModal(true);
    }
  }, [searchParams, user, hasProviderProfile, pathname, router, studentSlug]);

  // Note: We no longer redirect caregivers away. They can view candidate profiles
  // and attempt to schedule — they'll be prompted to sign in with a business email
  // (separate account) when they try to submit.

  const firstName = studentName.split(" ")[0];

  // Check if user needs auth before submitting
  const requiresAuth = !user || !hasProviderProfile;

  // Handle schedule click - always open modal first
  const handleScheduleClick = useCallback(() => {
    setShowModal(true);
  }, []);

  // Handle auth required - save form data and redirect to provider onboarding
  // This takes the user through the full onboarding flow:
  // 1. Search for their business
  // 2. Claim existing listing OR create new account
  // 3. Return to candidate page with ?schedule=pending to complete scheduling
  const handleAuthRequired = useCallback((formData: ScheduleFormData) => {
    // Save form data to sessionStorage with candidate slug
    sessionStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({
      ...formData,
      candidateSlug: studentSlug,
    }));

    // Close the modal before redirecting
    setShowModal(false);

    // Redirect to provider onboarding with return URL
    const returnUrl = `${pathname}?schedule=pending`;
    router.push(`/provider/onboarding?next=${encodeURIComponent(returnUrl)}`);
  }, [router, pathname, studentSlug]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSavedFormData(undefined);
  }, []);

  // Handle successful schedule
  const handleScheduled = useCallback(() => {
    setShowModal(false);
    setScheduled(true);
    setSavedFormData(undefined);
    // Clean up any saved data
    sessionStorage.removeItem(SCHEDULE_STORAGE_KEY);
  }, []);

  // ── Own profile preview mode ──
  // Show a disabled preview of what providers see
  if (isViewingOwnProfile) {
    if (variant === "sticky") {
      return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Provider preview
            </div>
            <Link
              href="/portal/medjobs"
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      );
    }

    // Sidebar/inline preview
    const isInline = variant === "inline";
    return (
      <div className={isInline ? "space-y-4" : "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"}>
        {/* Preview badge */}
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Provider Preview
        </div>

        {/* Disabled CTA button */}
        <div
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-200 rounded-xl text-sm font-semibold text-gray-400 cursor-not-allowed"
          aria-disabled="true"
        >
          <CalendarIcon />
          Schedule Interview
        </div>

        <p className="text-xs text-gray-400 text-center">
          This is how providers see your profile
        </p>

        {/* Edit profile link */}
        <Link
          href="/portal/medjobs"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-primary-200 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
          Edit your profile
        </Link>
      </div>
    );
  }

  // ── Sticky mobile bar ──
  if (variant === "sticky") {
    return (
      <>
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb">
          <button
            onClick={handleScheduleClick}
            disabled={scheduled}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-emerald-600 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            {scheduled ? "Interview Requested!" : "Schedule Interview"}
          </button>
        </div>
        {showModal && (
          <ScheduleInterviewModal
            studentProfileId={studentId}
            otherName={studentName}
            onClose={handleModalClose}
            onScheduled={handleScheduled}
            requiresAuth={requiresAuth}
            onAuthRequired={handleAuthRequired}
            initialValues={savedFormData}
          />
        )}
      </>
    );
  }

  // ── Sidebar/Inline variant (desktop) ──
  const isInline = variant === "inline";

  return (
    <>
      <div className={isInline ? "space-y-4" : "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"}>
        {/* Header text for non-authenticated users */}
        {!user && (
          <div>
            <p className="text-base font-semibold text-gray-900 leading-snug">
              Want to connect with {firstName}?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Set up a provider account to schedule an interview.
            </p>
          </div>
        )}

        {/* Schedule CTA */}
        {scheduled ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium text-center">
            Interview request sent to {firstName}!
          </div>
        ) : (
          <button
            onClick={handleScheduleClick}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            Schedule Interview
          </button>
        )}

        {/* Verification nudge for unverified providers */}
        {user && hasProviderProfile && activeProfile?.verification_state !== "verified" && !scheduled && (
          <p className="text-xs text-gray-500 text-center">
            <Link href="/provider/verification" className="text-primary-600 hover:text-primary-700 font-medium">
              Verify your business
            </Link>
            {" "}to see contact info
          </p>
        )}

        {/* Takes less than a minute helper text for non-users */}
        {!user && !isInline && (
          <p className="text-center text-xs text-gray-400">
            Takes less than a minute to get started.
          </p>
        )}
      </div>

      {showModal && (
        <ScheduleInterviewModal
          studentProfileId={studentId}
          otherName={studentName}
          onClose={handleModalClose}
          onScheduled={handleScheduled}
          requiresAuth={requiresAuth}
          onAuthRequired={handleAuthRequired}
          initialValues={savedFormData}
        />
      )}
    </>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
