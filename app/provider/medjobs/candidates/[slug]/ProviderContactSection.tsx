"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import ScheduleInterviewModal from "@/components/medjobs/ScheduleInterviewModal";
import UpgradeModal from "@/components/medjobs/UpgradeModal";
import type { AccessTier } from "@/lib/medjobs-access";

interface ProviderContactSectionProps {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  studentSlug: string;
  variant?: "sidebar" | "sticky" | "inline";
  /** Pre-fetched count of active interviews with this student */
  initialInterviewCount?: number;
  /** Pre-fetched count of pending verification interviews */
  initialPendingCount?: number;
  /** Provider's access tier for paywall gating */
  accessTier?: AccessTier;
  /** Provider's credits used count for upgrade modal */
  creditsUsed?: number;
  /** Provider verification status */
  isVerified?: boolean;
  /** Called when unverified provider tries to schedule */
  onVerifyClick?: () => void;
}

export default function ProviderContactSection({
  studentId,
  studentName,
  studentEmail,
  studentPhone,
  studentSlug,
  variant = "sidebar",
  initialInterviewCount = 0,
  initialPendingCount = 0,
  accessTier,
  creditsUsed = 0,
  isVerified,
  onVerifyClick,
}: ProviderContactSectionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, openAuth } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Track interview counts
  const [interviewCount, setInterviewCount] = useState(initialInterviewCount);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);

  const isFreeExhausted = accessTier === "free_exhausted";
  const hasInterviews = interviewCount > 0;
  const hasPendingInterviews = pendingCount > 0;

  // Sync with parent state when it updates
  useEffect(() => {
    setInterviewCount(initialInterviewCount);
    setPendingCount(initialPendingCount);
  }, [initialInterviewCount, initialPendingCount]);

  // Auto-open schedule modal when arriving from inline onboarding flow
  const hasHandledScheduleParam = useRef(false);
  useEffect(() => {
    if (hasHandledScheduleParam.current) return;

    const scheduleParam = searchParams.get("schedule");
    if (scheduleParam === "true" && user) {
      hasHandledScheduleParam.current = true;

      // Clear the query param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("schedule");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });

      // Open the schedule modal
      setShowModal(true);
    }
  }, [searchParams, user, pathname, router]);

  const requiresAuth = !user;

  const handleAuthRequired = useCallback(() => {
    openAuth({
      intent: "provider",
      headline: `Connect with ${studentName.split(" ")[0]}`,
      subline: "Sign in with your business email for instant verification",
      deferred: {
        action: "hire-candidate",
        returnUrl: pathname,
      },
    });
  }, [openAuth, studentName, pathname]);

  const handleScheduleClick = useCallback(() => {
    if (requiresAuth) {
      handleAuthRequired();
      return;
    }
    if (isFreeExhausted) {
      setShowUpgradeModal(true);
      return;
    }
    setShowModal(true);
  }, [requiresAuth, handleAuthRequired, isFreeExhausted]);

  // Called when interview is successfully scheduled
  const handleInterviewScheduled = useCallback(() => {
    setShowModal(false);
    // Increment the count (if unverified, also increment pending)
    setInterviewCount((c) => c + 1);
    if (!isVerified) {
      setPendingCount((c) => c + 1);
    }
  }, [isVerified]);

  const firstName = studentName.split(" ")[0];

  // ── Sticky mobile bar ──
  if (variant === "sticky") {
    // Unverified with pending interviews: show Verify + Schedule buttons horizontally
    const showDualButtons = !isVerified && hasPendingInterviews;

    return (
      <>
        <div
          className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
        >
          <div className="flex gap-2">
            {showDualButtons ? (
              <>
                {/* Verify button (primary) */}
                <button
                  onClick={() => onVerifyClick?.()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
                >
                  <CheckIcon />
                  <span>Verify</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{pendingCount}</span>
                </button>
                {/* Schedule another button (secondary) */}
                <button
                  onClick={handleScheduleClick}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
                >
                  <PlusIcon />
                </button>
              </>
            ) : (
              /* Single schedule button */
              <button
                onClick={handleScheduleClick}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                <CalendarIcon />
                <span>{hasInterviews ? "Schedule Another" : "Schedule Interview"}</span>
                {hasInterviews && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{interviewCount}</span>
                )}
              </button>
            )}
            {/* Phone button - only shows if studentPhone is available (paid+verified) */}
            {studentPhone && (
              <a
                href={`tel:${studentPhone}`}
                className="w-12 h-12 flex items-center justify-center bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </a>
            )}
          </div>
        </div>
        {showModal && (
          <ScheduleInterviewModal
            studentProfileId={studentId}
            otherName={studentName}
            onClose={() => setShowModal(false)}
            onScheduled={handleInterviewScheduled}
          />
        )}
        {showUpgradeModal && (
          <UpgradeModal creditsUsed={creditsUsed} onClose={() => setShowUpgradeModal(false)} />
        )}
      </>
    );
  }

  // ── Sidebar/Inline variant (desktop) ──
  const isInline = variant === "inline";
  const wrapperClass = isInline
    ? "space-y-4"
    : "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4";

  // If not authenticated at all, show auth-gated UI
  if (requiresAuth) {
    return (
      <div className={wrapperClass}>
        <div className={isInline ? "" : "text-center py-2"}>
          <p className={`text-sm text-gray-500 ${isInline ? "mb-3" : "mb-4"}`}>
            Sign in to contact {firstName} and schedule an interview
          </p>
          <button
            onClick={handleAuthRequired}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            Schedule Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {/* Contact Info */}
      {(studentEmail || studentPhone) && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Contact Info</h3>
          {studentEmail && (
            <a
              href={`mailto:${studentEmail}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="truncate">{studentEmail}</span>
            </a>
          )}
          {studentPhone && (
            <a
              href={`tel:${studentPhone}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {studentPhone}
            </a>
          )}
        </div>
      )}

      {/* Interview Status Badge */}
      {hasInterviews && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          hasPendingInterviews && !isVerified
            ? "bg-amber-50 border border-amber-200 text-amber-700"
            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
        }`}>
          {hasPendingInterviews && !isVerified ? (
            <>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>
                {pendingCount} interview{pendingCount > 1 ? "s" : ""} pending
                <span className="hidden sm:inline"> — verify to notify {firstName}</span>
              </span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{interviewCount} interview{interviewCount > 1 ? "s" : ""} requested</span>
            </>
          )}
        </div>
      )}

      {/* Primary CTA - Verify (for unverified with pending) */}
      {hasPendingInterviews && !isVerified && (
        <button
          onClick={() => onVerifyClick?.()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <CheckIcon />
          Verify Account
        </button>
      )}

      {/* Schedule Button - always available */}
      <button
        onClick={handleScheduleClick}
        className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          hasPendingInterviews && !isVerified
            ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            : "bg-gray-900 hover:bg-gray-800 text-white"
        }`}
      >
        <CalendarIcon />
        {hasInterviews ? "Schedule Another Interview" : "Schedule Interview"}
      </button>

      {showModal && (
        <ScheduleInterviewModal
          studentProfileId={studentId}
          otherName={studentName}
          onClose={() => setShowModal(false)}
          onScheduled={handleInterviewScheduled}
        />
      )}
      {showUpgradeModal && (
        <UpgradeModal creditsUsed={creditsUsed} onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
