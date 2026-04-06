"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { VerificationState } from "@/lib/types";

interface VerificationSubmissionData {
  name: string;
  role: string;
  phone?: string | null;
  affiliation?: string | null;
  submitted_at: string;
}

interface VerificationStatusBadgeProps {
  verificationState: VerificationState;
  profileId: string;
  onRequestVerification?: (existingData?: VerificationSubmissionData) => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  administrator: "Administrator",
  marketing: "Marketing Director",
  staff: "Staff Member",
  other: "Other",
};

export default function VerificationStatusBadge({
  verificationState,
  profileId,
  onRequestVerification,
}: VerificationStatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [submissionData, setSubmissionData] = useState<VerificationSubmissionData | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  // Check if we're on mobile (below lg breakpoint)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch submission data when tooltip/sheet opens for pending state
  const fetchSubmissionData = useCallback(async () => {
    if (verificationState !== "pending" || submissionData) return;

    setLoadingSubmission(true);
    try {
      const response = await fetch(`/api/provider/verification?profileId=${profileId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.submission) {
          setSubmissionData(data.submission);
        }
      }
    } catch {
      // Silently fail - we'll just show generic pending message
    } finally {
      setLoadingSubmission(false);
    }
  }, [verificationState, profileId, submissionData]);

  // Close tooltip when clicking outside (desktop only)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    }

    if (showTooltip && !isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTooltip, isMobile]);

  // Fetch submission data when tooltip/sheet opens
  useEffect(() => {
    if ((showTooltip || showSheet) && verificationState === "pending") {
      fetchSubmissionData();
    }
  }, [showTooltip, showSheet, verificationState, fetchSubmissionData]);

  const handleBadgeClick = () => {
    if (isMobile) {
      setShowSheet(true);
    } else {
      setShowTooltip(!showTooltip);
    }
  };

  const handleClose = () => {
    setShowTooltip(false);
    setShowSheet(false);
  };

  const handleAction = () => {
    handleClose();
    onRequestVerification?.(submissionData || undefined);
  };

  const formatSubmittedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Shared content component
  const TooltipContent = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className={inSheet ? "" : "relative"}>
      {/* VERIFIED STATE */}
      {verificationState === "verified" && (
        <>
          <div className={`flex items-center gap-2 ${inSheet ? "mb-2" : "mb-1"}`}>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h4 className={`font-semibold text-gray-900 ${inSheet ? "text-base" : "text-sm"}`}>
              Verified Business
            </h4>
          </div>
          <p className={`text-gray-500 leading-relaxed ${inSheet ? "text-sm" : "text-xs"}`}>
            Your profile has been verified. Families can see your full contact info and trust signals.
          </p>
        </>
      )}

      {/* PENDING STATE */}
      {verificationState === "pending" && (
        <>
          <div className={`flex items-center gap-2 ${inSheet ? "mb-2" : "mb-1"}`}>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className={`font-semibold text-gray-900 ${inSheet ? "text-base" : "text-sm"}`}>
              Verification Pending
            </h4>
          </div>
          <p className={`text-gray-500 leading-relaxed ${inSheet ? "text-sm mb-4" : "text-xs mb-3"}`}>
            We&apos;re reviewing your request. This usually takes 1-2 business days.
          </p>

          {loadingSubmission ? (
            <div className="py-2">
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ) : submissionData ? (
            <div className={`bg-gray-50 rounded-lg ${inSheet ? "p-4" : "p-3"} space-y-1.5`}>
              <p className={`font-medium text-gray-400 uppercase tracking-wide ${inSheet ? "text-xs" : "text-[11px]"}`}>
                Your submission
              </p>
              <div className={`text-gray-600 space-y-1 ${inSheet ? "text-sm" : "text-xs"}`}>
                <p><span className="text-gray-400">Name:</span> {submissionData.name}</p>
                <p><span className="text-gray-400">Role:</span> {ROLE_LABELS[submissionData.role] || submissionData.role}</p>
                {submissionData.submitted_at && (
                  <p><span className="text-gray-400">Submitted:</span> {formatSubmittedDate(submissionData.submitted_at)}</p>
                )}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleAction}
            className={`mt-4 w-full font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${inSheet ? "py-3 text-base" : "py-2 text-sm"}`}
          >
            Update Submission
          </button>
          <p className={`mt-2 text-gray-400 text-center ${inSheet ? "text-xs" : "text-[11px]"}`}>
            Questions?{" "}
            <Link href="/contact" className="text-primary-600 hover:underline">
              Contact support
            </Link>
          </p>
        </>
      )}

      {/* UNVERIFIED STATE */}
      {verificationState === "unverified" && (
        <>
          <div className={`flex items-center gap-2 ${inSheet ? "mb-2" : "mb-1"}`}>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h4 className={`font-semibold text-gray-900 ${inSheet ? "text-base" : "text-sm"}`}>
              Limited Access
            </h4>
          </div>
          <p className={`text-gray-500 leading-relaxed ${inSheet ? "text-sm" : "text-xs"}`}>
            Some features are restricted until you verify your business. Your contact info is hidden from families.
          </p>
          <button
            type="button"
            onClick={handleAction}
            className={`mt-4 w-full font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors ${inSheet ? "py-3 text-base" : "py-2 text-sm"}`}
          >
            Complete Verification
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={badgeRef}
          type="button"
          onClick={handleBadgeClick}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all hover:opacity-80 ${
            verificationState === "verified"
              ? "bg-green-50 text-green-700 border-green-200"
              : verificationState === "pending"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {verificationState === "verified" && (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {verificationState === "pending" && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {verificationState === "unverified" && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          )}
          {verificationState === "verified" && "Verified"}
          {verificationState === "pending" && "Pending Review"}
          {verificationState === "unverified" && "Limited Access"}
        </button>

        {/* Desktop Tooltip */}
        {showTooltip && !isMobile && (
          <div
            ref={tooltipRef}
            className="absolute top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 right-0"
            style={{ animation: "fade-in 0.15s ease-out both" }}
          >
            {/* Arrow */}
            <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />
            <TooltipContent />
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      {showSheet && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={handleClose}
            style={{ animation: "fade-in 0.2s ease-out both" }}
          />

          {/* Sheet */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-xl pb-[env(safe-area-inset-bottom)]"
            style={{ animation: "slide-up 0.3s ease-out both" }}
          >
            {/* Handle */}
            <div className="pt-3 pb-2 px-6 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-gray-900">
                  Verification Status
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <TooltipContent inSheet />
            </div>

            {/* Safe area padding for iPhone */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
