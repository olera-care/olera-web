"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface GoLiveNudgeProps {
  /** Dismisses the nudge */
  onDismiss: () => void;
  /** Called after successful publish */
  onPublished?: () => void;
  /** Connection ID for localStorage key and analytics */
  connectionId: string;
  /** Profile data for validation */
  profile?: {
    city?: string | null;
    state?: string | null;
    care_types?: string[] | null;
  } | null;
}

export default function GoLiveNudge({
  onDismiss,
  onPublished,
  connectionId,
  profile,
}: GoLiveNudgeProps) {
  const { refreshAccountData } = useAuth();
  const [publishing, setPublishing] = useState(false);

  // Check if profile has minimum data to go live
  const hasLocation = Boolean(profile?.city && profile?.state);
  const hasCareTypes = Boolean(profile?.care_types && profile.care_types.length > 0);
  const canGoLive = hasLocation && hasCareTypes;

  // Fire analytics event on render
  useEffect(() => {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "nudge_shown",
        metadata: {
          nudge_type: "go_live",
          connection_id: connectionId,
          location: "conversation_panel",
        },
      }),
    }).catch(() => {});
  }, [connectionId]);

  const handleGoLive = useCallback(async () => {
    if (!canGoLive || publishing) return;

    // Track click
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "nudge_clicked",
        metadata: {
          nudge_type: "go_live",
          connection_id: connectionId,
          action: "publish_profile",
        },
      }),
    }).catch(() => {});

    setPublishing(true);
    try {
      const res = await fetch("/api/care-post/activate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: profile?.city,
          state: profile?.state,
        }),
      });

      if (!res.ok) throw new Error("Failed to activate");

      await refreshAccountData?.();
      onPublished?.();
      onDismiss(); // Hide nudge after successful publish
    } catch (err) {
      console.error("[GoLiveNudge] Failed to publish:", err);
      setPublishing(false);
    }
  }, [canGoLive, publishing, connectionId, profile, refreshAccountData, onPublished, onDismiss]);

  const handleDismiss = () => {
    // Track dismiss
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "nudge_dismissed",
        metadata: {
          nudge_type: "go_live",
          connection_id: connectionId,
        },
      }),
    }).catch(() => {});
    onDismiss();
  };

  // Don't render if profile can't go live (missing location or care types)
  if (!canGoLive) return null;

  return (
    <div className="px-4 sm:px-6 py-3">
      {/* Single row on all sizes — compact layout */}
      <div className="flex items-center gap-3">
        {/* Text */}
        <p className="text-[14px] text-gray-600 flex-1">
          Let providers find you and reach out
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGoLive}
            disabled={publishing}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold rounded-full transition-colors disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Go live"}
          </button>
          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={publishing}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
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
