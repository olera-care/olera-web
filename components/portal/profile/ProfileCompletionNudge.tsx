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
}

export default function ProfileCompletionNudge({
  providerName,
  onComplete,
  onDismiss,
  connectionId,
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
    <div className="flex justify-center py-4">
      <div className="flex flex-col items-center text-center max-w-sm px-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>

        {/* Content */}
        <p className="text-[15px] font-medium text-gray-900">
          Help {firstName} respond faster
        </p>
        <p className="text-[13px] text-gray-500 mt-1">
          Complete your profile so they can learn about your care needs
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4">
          <button
            type="button"
            onClick={handleComplete}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold rounded-full transition-colors"
          >
            Complete Profile
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
