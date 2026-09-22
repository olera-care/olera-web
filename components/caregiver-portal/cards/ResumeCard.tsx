"use client";

import { useState } from "react";
import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";

interface ResumeCardProps {
  meta: StudentMetadata;
  profileId: string;
  onEdit?: () => void;
}

export default function ResumeCard({ meta, profileId, onEdit }: ResumeCardProps) {
  const [viewingResume, setViewingResume] = useState(false);

  const hasResume = !!meta.resume_url;
  const hasLinkedin = !!meta.linkedin_url;
  const isComplete = hasResume || hasLinkedin;

  // Extract filename from resume URL path
  const getResumeFilename = () => {
    if (!meta.resume_url) return null;
    const parts = meta.resume_url.split("/");
    const filename = parts[parts.length - 1];
    // Remove UUID prefix if present (format: uuid_filename.pdf)
    const match = filename.match(/^[a-f0-9-]+_(.+)$/i);
    return match ? match[1] : filename;
  };

  // Open resume in new tab via signed URL
  const handleViewResume = async () => {
    if (!meta.resume_url || viewingResume) return;

    setViewingResume(true);
    try {
      const res = await fetch("/api/medjobs/get-document-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: meta.resume_url, studentProfileId: profileId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      }
    } catch {
      // Silently fail - user can try again
    } finally {
      setViewingResume(false);
    }
  };

  // Format LinkedIn URL for display
  const getLinkedInDisplay = () => {
    if (!meta.linkedin_url) return null;
    try {
      const url = new URL(meta.linkedin_url);
      return url.pathname; // e.g., /in/username
    } catch {
      return meta.linkedin_url.replace(/^https?:\/\//, "");
    }
  };

  const resumeFilename = getResumeFilename();
  const linkedInDisplay = getLinkedInDisplay();

  return (
    <CaregiverSectionCard
      title="Resume & LinkedIn"
      isComplete={isComplete}
      id="resume"
      onEdit={onEdit}
    >
      {!isComplete ? (
        <EmptyState
          message="No resume or LinkedIn"
          subMessage="Add your resume or LinkedIn to strengthen your profile."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Resume - larger preview with View action */}
          {hasResume && (
            <button
              type="button"
              onClick={handleViewResume}
              disabled={viewingResume}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group text-left disabled:opacity-70"
            >
              {/* Larger document icon */}
              <div className="w-14 h-[72px] rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-red-500 mb-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <span className="text-[10px] font-bold text-red-500">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                  {resumeFilename || "Resume.pdf"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {viewingResume ? "Opening..." : "Click to view"}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}

          {/* LinkedIn - show URL */}
          {hasLinkedin && (
            <a
              href={meta.linkedin_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-[#0A66C2] transition-colors">
                  LinkedIn Profile
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {linkedInDisplay}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0A66C2] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
