"use client";

import { useEffect } from "react";

interface ProfileCompletionNudgeProps {
  /** @deprecated No longer used - kept for backward compatibility */
  providerName?: string;
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

  return (
    <div className="px-4 sm:px-6 py-3">
      {/* Single row on all sizes — compact layout */}
      <div className="flex items-center gap-3">
        {/* Text */}
        <p className="text-[14px] text-gray-600 flex-1">
          Help us understand your care needs
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleComplete}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold rounded-full transition-colors"
          >
            Complete{completionPercentage !== undefined && ` · ${Math.round(completionPercentage)}%`}
          </button>
          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
