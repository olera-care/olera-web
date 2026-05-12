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
    <div className="mx-4 sm:mx-6 mt-4 mb-2">
      <div className="flex items-start gap-3 px-4 py-3.5 bg-primary-50/60 border border-primary-100/60 rounded-xl">
        {/* Sparkle icon */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-gray-900">
            Help {firstName} respond faster
          </p>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Complete your profile so providers can learn about your care needs
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleComplete}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[13px] font-semibold rounded-full transition-colors"
            >
              Complete Profile
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
