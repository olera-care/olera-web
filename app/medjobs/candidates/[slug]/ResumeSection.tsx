"use client";

import { useState, useMemo } from "react";
import ScheduleInterviewModal, { type JobDetails } from "@/components/medjobs/ScheduleInterviewModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { DEMAND_PROFILE_KEY, type DemandProfile } from "@/lib/medjobs/eligibility";
import { REQUIREMENTS_KEY, type MedjobsRequirements } from "@/lib/medjobs/hiring-needs-questions";

interface ResumeSectionProps {
  resumeUrl: string;
  studentId: string;
  studentDisplayName: string;
  hasExistingInterview: boolean;
  isOwnProfile: boolean;
}

/**
 * ResumeSection — handles resume access with interview gating.
 *
 * If the provider has NOT scheduled an interview with this student,
 * clicking the resume opens the ScheduleInterviewModal instead of downloading.
 * Once an interview exists, the resume downloads directly.
 */
export default function ResumeSection({
  resumeUrl,
  studentId,
  studentDisplayName,
  hasExistingInterview,
  isOwnProfile,
}: ResumeSectionProps) {
  const { profiles } = useAuth();
  const [showSchedule, setShowSchedule] = useState(false);

  const providerProfile = profiles.find(
    (p) => p.type === "organization" || p.type === "caregiver"
  );
  const providerMeta = useMemo(
    () => (providerProfile?.metadata ?? {}) as Record<string, unknown>,
    [providerProfile?.metadata]
  );

  // Extract hiring defaults to pass to the schedule modal
  const jobDetails = useMemo((): JobDetails | undefined => {
    const demand = providerMeta[DEMAND_PROFILE_KEY] as Partial<DemandProfile> | undefined;
    const requirements = providerMeta[REQUIREMENTS_KEY] as MedjobsRequirements | undefined;
    if (!demand && !requirements) return undefined;
    return {
      job_description: demand?.job_description,
      coverage_buckets: demand?.coverage_buckets,
      prn_open: demand?.prn_open,
      requirements,
    };
  }, [providerMeta]);

  // If own profile or has existing interview, allow direct download
  const canDownload = isOwnProfile || hasExistingInterview;

  const handleClick = (e: React.MouseEvent) => {
    if (!canDownload) {
      e.preventDefault();
      setShowSchedule(true);
    }
    // Otherwise, let the <a> handle the navigation
  };

  return (
    <>
      <div className="py-8 px-6 sm:px-8 border-t border-gray-200">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
          Documents
        </h2>
        <div className="space-y-3">
          <a
            href={canDownload ? resumeUrl : "#"}
            target={canDownload ? "_blank" : undefined}
            rel={canDownload ? "noopener noreferrer" : undefined}
            onClick={handleClick}
            className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                Resume
              </p>
              <p className="text-xs text-gray-500">
                {canDownload ? "View or download PDF" : "Schedule interview to view"}
              </p>
            </div>
            {canDownload ? (
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            )}
          </a>
        </div>
        {isOwnProfile && (
          <p className="mt-4 text-xs text-gray-400">
            Only you and providers who have scheduled an interview can see this section.
          </p>
        )}
      </div>

      {showSchedule && (
        <ScheduleInterviewModal
          studentProfileId={studentId}
          otherName={studentDisplayName}
          onClose={() => setShowSchedule(false)}
          onScheduled={() => {
            setShowSchedule(false);
            // Reload page to reflect updated interview status
            window.location.reload();
          }}
          jobDetails={jobDetails}
        />
      )}
    </>
  );
}
