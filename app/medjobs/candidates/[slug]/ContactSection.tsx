"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import ScheduleInterviewModal, { ScheduleFormData } from "@/components/medjobs/ScheduleInterviewModal";
import QuickScheduleModal from "@/components/medjobs/QuickScheduleModal";
import UpgradeModal from "@/components/medjobs/UpgradeModal";
import { getAccessTier } from "@/lib/medjobs-access";
import type { StudentMetadata } from "@/lib/types";

const SCHEDULE_STORAGE_KEY = "medjobs_schedule_draft";
const SCHEDULED_CANDIDATES_KEY = "medjobs_scheduled_candidates";

interface CandidateData {
  id: string;
  slug: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  city: string | null;
  state: string | null;
  metadata: StudentMetadata;
}

export default function ContactSection({
  candidate,
  variant = "sidebar",
  initialScheduled,
}: {
  candidate: CandidateData;
  variant?: "sidebar" | "sticky" | "inline";
  /**
   * Server-fetched "already scheduled" state. When provided, overrides
   * the localStorage fallback — this is the source of truth for
   * authenticated providers, while anonymous users fall back to localStorage.
   */
  initialScheduled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, activeProfile, profiles } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showQuickScheduleModal, setShowQuickScheduleModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [scheduled, setScheduled] = useState(initialScheduled ?? false);
  const [savedFormData, setSavedFormData] = useState<ScheduleFormData | undefined>();

  // If the parent passes an updated initialScheduled value, adopt it
  // (e.g., when server re-renders after an interview is created).
  useEffect(() => {
    if (initialScheduled !== undefined) {
      setScheduled(initialScheduled);
    }
  }, [initialScheduled]);

  // Load scheduled state from localStorage on mount — ONLY when the parent
  // did not pass initialScheduled (i.e., anonymous users without a server
  // source of truth). Authenticated providers get initialScheduled from the
  // server via the detail page, so we skip localStorage to avoid races.
  useEffect(() => {
    if (initialScheduled !== undefined) return;
    try {
      const stored = localStorage.getItem(SCHEDULED_CANDIDATES_KEY);
      if (stored) {
        const scheduledIds = JSON.parse(stored) as string[];
        if (scheduledIds.includes(candidate.id)) {
          setScheduled(true);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [candidate.id, initialScheduled]);

  // Only organization profiles are providers (caregivers are job-seekers)
  const hasProviderProfile = profiles.some((p) => p.type === "organization");

  // Compute provider's access tier for paywall gating
  const providerProfile = profiles.find((p) => p.type === "organization" || p.type === "caregiver");
  const providerMeta = (providerProfile?.metadata ?? {}) as Record<string, unknown>;
  const accessInfo = getAccessTier(!!providerProfile, hasProviderProfile ? providerMeta : null);
  const isFreeExhausted = accessInfo.tier === "free_exhausted";

  // Check if caregiver is viewing their own profile
  const ownCaregiverProfile = profiles.find(
    (p) => (p.type === "student" || p.type === "caregiver") && p.slug === candidate.slug
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
          if (parsed.candidateSlug === candidate.slug) {
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
  }, [searchParams, user, hasProviderProfile, pathname, router, candidate.slug]);

  // Note: We no longer redirect caregivers away. They can view candidate profiles
  // and attempt to schedule — they'll be prompted to sign in with a business email
  // (separate account) when they try to submit.

  const firstName = candidate.displayName.split(" ")[0];

  // Check if user needs auth before submitting
  const requiresAuth = !user || !hasProviderProfile;

  // Handle schedule click
  // For unauthenticated users: show quick schedule modal (2-step flow)
  // For authenticated providers: show schedule modal directly
  const handleScheduleClick = useCallback(() => {
    if (requiresAuth) {
      // Show quick schedule modal for unauthenticated users
      setShowQuickScheduleModal(true);
    } else if (isFreeExhausted) {
      // Authenticated provider who has hit their free limit
      setShowUpgradeModal(true);
    } else {
      setShowModal(true);
    }
  }, [requiresAuth, isFreeExhausted]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSavedFormData(undefined);
  }, []);

  // Handle successful schedule (persists to localStorage)
  const handleScheduled = useCallback(() => {
    setShowModal(false);
    setScheduled(true);
    setSavedFormData(undefined);
    // Clean up any saved data
    sessionStorage.removeItem(SCHEDULE_STORAGE_KEY);
    // Persist scheduled state to localStorage
    try {
      const stored = localStorage.getItem(SCHEDULED_CANDIDATES_KEY);
      const scheduledIds = stored ? (JSON.parse(stored) as string[]) : [];
      if (!scheduledIds.includes(candidate.id)) {
        scheduledIds.push(candidate.id);
        localStorage.setItem(SCHEDULED_CANDIDATES_KEY, JSON.stringify(scheduledIds));
      }
    } catch {
      // Ignore storage errors
    }
  }, [candidate.id]);

  // Handle quick schedule success
  const handleQuickScheduled = useCallback(() => {
    setScheduled(true);
    // Persist scheduled state to localStorage
    try {
      const stored = localStorage.getItem(SCHEDULED_CANDIDATES_KEY);
      const scheduledIds = stored ? (JSON.parse(stored) as string[]) : [];
      if (!scheduledIds.includes(candidate.id)) {
        scheduledIds.push(candidate.id);
        localStorage.setItem(SCHEDULED_CANDIDATES_KEY, JSON.stringify(scheduledIds));
      }
    } catch {
      // Ignore storage errors
    }
  }, [candidate.id]);

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
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb space-y-2">
          {/* Success banner */}
          {scheduled && (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Request sent — check your email</span>
            </div>
          )}
          {/* CTA - always visible */}
          <button
            onClick={handleScheduleClick}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            {scheduled ? "Schedule Another" : "Schedule Interview"}
          </button>
        </div>
        {showModal && (
          <ScheduleInterviewModal
            studentProfileId={candidate.id}
            otherName={candidate.displayName}
            onClose={handleModalClose}
            onScheduled={handleScheduled}
            initialValues={savedFormData}
          />
        )}
        <QuickScheduleModal
          isOpen={showQuickScheduleModal}
          onClose={() => setShowQuickScheduleModal(false)}
          onScheduled={handleQuickScheduled}
          candidate={candidate}
        />
        {showUpgradeModal && (
          <UpgradeModal creditsUsed={accessInfo.creditsUsed} onClose={() => setShowUpgradeModal(false)} />
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
              Schedule an interview to get started.
            </p>
          </div>
        )}

        {/* Success banner */}
        {scheduled && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Request sent — check your email</span>
          </div>
        )}

        {/* Schedule CTA - always visible */}
        <button
          onClick={handleScheduleClick}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <CalendarIcon />
          {scheduled ? "Schedule Another" : "Schedule Interview"}
        </button>

        {/* Takes less than a minute helper text for non-users */}
        {!user && !isInline && (
          <p className="text-center text-xs text-gray-400">
            Takes less than a minute.
          </p>
        )}
      </div>

      {showModal && (
        <ScheduleInterviewModal
          studentProfileId={candidate.id}
          otherName={candidate.displayName}
          onClose={handleModalClose}
          onScheduled={handleScheduled}
          initialValues={savedFormData}
        />
      )}
      <QuickScheduleModal
        isOpen={showQuickScheduleModal}
        onClose={() => setShowQuickScheduleModal(false)}
        onScheduled={handleQuickScheduled}
        candidate={candidate}
      />
      {showUpgradeModal && (
        <UpgradeModal creditsUsed={accessInfo.creditsUsed} onClose={() => setShowUpgradeModal(false)} />
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
