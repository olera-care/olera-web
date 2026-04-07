"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { VerificationState } from "@/lib/types";

interface VerificationSubmissionData {
  name: string;
  role: string;
  phone?: string | null;
  affiliation?: string | null;
  submitted_at: string;
}

interface VerificationStatusCardProps {
  verificationState: VerificationState;
  profileId: string;
  onRequestVerification: (existingData?: VerificationSubmissionData) => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  administrator: "Administrator",
  executive_director: "Executive Director",
  office_manager: "Office Manager",
  marketing: "Marketing / Communications",
  staff: "Staff Member",
  other: "Other",
};

/**
 * Standalone verification card for the sidebar.
 * Only rendered for unverified/pending providers.
 * Shows as a prominent but non-intrusive card above profile completeness.
 */
export default function VerificationStatusCard({
  verificationState,
  profileId,
  onRequestVerification,
}: VerificationStatusCardProps) {
  const [submissionData, setSubmissionData] = useState<VerificationSubmissionData | null>(null);
  const [loading, setLoading] = useState(false);

  const isPending = verificationState === "pending";
  const isUnverified = verificationState === "unverified" || !verificationState;

  // Fetch submission data for pending state
  const fetchSubmissionData = useCallback(async () => {
    if (verificationState !== "pending" || submissionData) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/provider/verification?profileId=${profileId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.submission) {
          setSubmissionData(data.submission);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [verificationState, profileId, submissionData]);

  useEffect(() => {
    if (verificationState === "pending") {
      fetchSubmissionData();
    }
  }, [verificationState, fetchSubmissionData]);

  const formatSubmittedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAction = () => {
    onRequestVerification(submissionData || undefined);
  };

  // Don't render for verified providers
  if (verificationState === "verified") {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 border-b ${isPending ? "border-blue-100 bg-gradient-to-r from-blue-50/80 to-white" : "border-gray-100 bg-gradient-to-r from-gray-50/80 to-white"}`}>
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isPending
              ? "bg-blue-100"
              : "bg-gray-100"
          }`}>
            {isPending ? (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            )}
          </div>

          {/* Title + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-gray-900">
                {isPending ? "Verification Pending" : "Verify Your Business"}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isPending
                ? "Under review (1-2 business days)"
                : "Unlock full features"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {/* PENDING STATE */}
        {isPending && (
          <>
            {loading ? (
              <div className="py-2">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ) : submissionData ? (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Your submission
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="text-gray-400">Name:</span> {submissionData.name}</p>
                  <p><span className="text-gray-400">Role:</span> {ROLE_LABELS[submissionData.role] || submissionData.role}</p>
                  {submissionData.submitted_at && (
                    <p><span className="text-gray-400">Submitted:</span> {formatSubmittedDate(submissionData.submitted_at)}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                We&apos;re reviewing your verification request.
              </p>
            )}

            <button
              type="button"
              onClick={handleAction}
              className="w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Update Submission
            </button>
            <p className="mt-3 text-[11px] text-gray-400 text-center">
              Questions?{" "}
              <Link href="/contact" className="text-primary-600 hover:underline">
                Contact support
              </Link>
            </p>
          </>
        )}

        {/* UNVERIFIED STATE */}
        {isUnverified && (
          <>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Your contact info is hidden from families. Verified providers get 2x more inquiries.
            </p>
            <button
              type="button"
              onClick={handleAction}
              className="w-full py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
            >
              Complete Verification
            </button>
          </>
        )}
      </div>
    </div>
  );
}
