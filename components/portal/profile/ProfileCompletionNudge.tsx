"use client";

import { useEffect } from "react";

interface ProfileCompletionNudgeProps {
  /** Provider name for personalized copy */
  providerName: string;
  /** Opens the ProfileEditWizard */
  onComplete: () => void;
  /** Dismisses the nudge */
  onDismiss: () => void;
  /** Connection ID for localStorage key */
  connectionId: string;
  /** Profile completion percentage (0-100) */
  completionPercentage?: number;
}

export default function ProfileCompletionNudge({
  providerName,
  onComplete,
  onDismiss,
  connectionId,
  completionPercentage,
}: ProfileCompletionNudgeProps) {
  // Fire analytics event on render
  useEffect(() => {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "nudge_shown",
        metadata: {
          nudge_type: "profile_completion",
          connection_id: connectionId,
          location: "conversation_panel",
        },
      }),
    }).catch(() => {});
  }, [connectionId]);

  const handleComplete = () => {
    // Track click
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "nudge_clicked",
        metadata: {
          nudge_type: "profile_completion",
          connection_id: connectionId,
          action: "complete_profile",
        },
      }),
    }).catch(() => {});
    onComplete();
  };

  const handleDismiss = () => {
    // Track dismiss
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "nudge_dismissed",
        metadata: {
          nudge_type: "profile_completion",
          connection_id: connectionId,
        },
      }),
    }).catch(() => {});
    onDismiss();
  };

  // Extract first name for more personal copy
  const firstName = providerName.split(" ")[0] || providerName;

  return (
    <div className="px-4 sm:px-6 py-3">
      {/* Desktop: single row | Mobile: compact card layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
        {/* Text + dismiss (mobile: inline, desktop: text only) */}
        <div className="flex items-start justify-between gap-2 sm:flex-1">
          <p className="text-[14px] text-gray-600 flex-1">
            <span className="font-medium text-gray-900">Help {firstName} respond faster</span>
            <span className="hidden sm:inline"> — </span>
            <span className="block sm:inline">complete your profile</span>
            {/* Mobile: show percentage inline with text */}
            {completionPercentage !== undefined && (
              <span className="sm:hidden text-gray-400"> · {Math.round(completionPercentage)}%</span>
            )}
          </p>
          {/* Mobile dismiss - top right */}
          <button
            type="button"
            onClick={handleDismiss}
            className="sm:hidden w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 -mt-0.5"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleComplete}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold rounded-full transition-colors"
          >
            {/* Mobile: shorter text, Desktop: full text with percentage */}
            <span className="sm:hidden">Complete Profile</span>
            <span className="hidden sm:inline">Complete Profile{completionPercentage !== undefined && ` · ${Math.round(completionPercentage)}%`}</span>
          </button>
          {/* Desktop dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
