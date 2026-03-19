"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import EditCarePostModal from "./EditCarePostModal";

const DELETE_REASONS = [
  "Found care",
  "Not ready yet",
  "Too many contacts",
  "Other",
];

interface CarePostSidebarProps {
  activeProfile: BusinessProfile;
  interestedCount: number;
  userEmail?: string;
  onPublish: () => Promise<void>;
  onDeactivate: () => Promise<void>;
  onDelete?: (reasons: string[]) => Promise<void>;
  onProfileUpdated?: () => void;
  /** If true, profile can go live (has location + care types) */
  canGoLive?: boolean;
  /** Called when user clicks "Go Live" - activates the profile */
  onGoLive?: () => Promise<void>;
  /** Show loading state for Go Live button */
  activating?: boolean;
}

export default function CarePostSidebar({
  activeProfile,
  interestedCount,
  userEmail,
  onPublish,
  onDeactivate,
  onDelete,
  onProfileUpdated,
  canGoLive = true,
  onGoLive,
  activating = false,
}: CarePostSidebarProps) {
  const meta = (activeProfile.metadata || {}) as FamilyMetadata;
  const carePost = meta.care_post;
  const isActive = carePost?.status === "active";
  const isPaused = carePost?.status === "paused";
  const hasPost = isActive || isPaused;

  const [publishing, setPublishing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [acceptingMatches, setAcceptingMatches] = useState(isActive);
  const [toggleMessage, setToggleMessage] = useState<"on" | "off" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDeleteReasons, setSelectedDeleteReasons] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync acceptingMatches with external isActive changes
  useEffect(() => {
    setAcceptingMatches(isActive);
  }, [isActive]);

  const profileLocation =
    activeProfile.city && activeProfile.state
      ? `${activeProfile.city}, ${activeProfile.state}`
      : null;

  const careTypes = activeProfile.care_types?.length
    ? activeProfile.care_types.map((ct) =>
        ct
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      )
    : [];

  const relationshipDisplay = meta.relationship_to_recipient
    ? meta.relationship_to_recipient
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const careForDisplay = relationshipDisplay
    ? `${relationshipDisplay}${meta.age ? `, age ${meta.age}` : ""}`
    : null;

  const scheduleDisplay = meta.schedule_preference || null;

  const timelineDisplay = meta.timeline
    ? meta.timeline
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const paymentDisplay = meta.payment_methods?.length
    ? meta.payment_methods[0]
    : null;

  // Active for duration
  const activeDays = carePost?.published_at
    ? Math.max(1, Math.floor((Date.now() - new Date(carePost.published_at).getTime()) / 86400000))
    : null;

  const initials = activeProfile.display_name
    ? activeProfile.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handlePublishAction = useCallback(async () => {
    setPublishing(true);
    setActionError(null);
    try {
      await onPublish();
    } catch {
      setActionError("Couldn't publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }, [onPublish]);

  const handleDeactivateAction = useCallback(async () => {
    setDeactivating(true);
    setActionError(null);
    try {
      await onDeactivate();
    } catch {
      setActionError("Couldn't pause. Please try again.");
    } finally {
      setDeactivating(false);
    }
  }, [onDeactivate]);

  const handleToggleAccepting = useCallback(async () => {
    if (acceptingMatches) {
      // Turning off — pause
      setAcceptingMatches(false);
      setToggleMessage("off");
      await handleDeactivateAction();
    } else {
      // Turning back on — re-publish
      setAcceptingMatches(true);
      setToggleMessage("on");
      await handlePublishAction();
    }
  }, [acceptingMatches, handleDeactivateAction, handlePublishAction]);

  // Auto-dismiss toggle message after 4 seconds
  useEffect(() => {
    if (!toggleMessage) return;
    const timer = setTimeout(() => setToggleMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toggleMessage]);

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), 4000);
    return () => clearTimeout(timer);
  }, [actionError]);

  const toggleDeleteReason = (reason: string) => {
    setSelectedDeleteReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      if (onDelete) {
        await onDelete(selectedDeleteReasons);
      } else {
        await onDeactivate();
      }
      setShowDeleteConfirm(false);
      setSelectedDeleteReasons([]);
    } catch {
      setActionError("Couldn't delete. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── No care profile — "Go Live" CTA ──
  if (!hasPost) {
    return (
      <div className="sticky top-24">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[15px] font-semibold text-gray-900">
                  Go live to get matches
                </h4>
                <p className="text-[12px] text-gray-500">
                  Let providers discover you
                </p>
              </div>
            </div>

            {/* Benefits list */}
            <ul className="space-y-2.5 mb-5">
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[13px] text-gray-600">Providers in your area can find and reach out to you</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[13px] text-gray-600">Review interested providers at your own pace</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[13px] text-gray-600">Pause or delete your profile anytime</span>
              </li>
            </ul>

            {/* Go Live button */}
            {canGoLive && onGoLive ? (
              <button
                onClick={onGoLive}
                disabled={activating}
                className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[14px] font-semibold hover:from-primary-400 hover:to-primary-500 transition-all shadow-[0_1px_3px_rgba(25,144,135,0.3)] disabled:opacity-70 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                {activating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Going live...
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                    Go Live
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handlePublishAction}
                disabled={publishing || !canGoLive}
                className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[14px] font-semibold hover:from-primary-400 hover:to-primary-500 transition-all shadow-[0_1px_3px_rgba(25,144,135,0.3)] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                {publishing ? "Publishing..." : "Go Live"}
              </button>
            )}

            {/* Hint if can't go live - link to complete setup */}
            {!canGoLive && (
              <p className="text-[12px] text-gray-400 text-center mt-3">
                <Link href="/welcome" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Complete your profile
                </Link>
                {" "}to go live
              </p>
            )}

            {/* Edit profile link - always available */}
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="w-full mt-3 min-h-[44px] py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
              Edit profile
            </button>
          </div>
        </div>

        {/* Edit modal for Not Live state */}
        {editModalOpen && (
          <EditCarePostModal
            profile={activeProfile}
            userEmail={userEmail}
            onClose={() => setEditModalOpen(false)}
            onSaved={() => {
              setEditModalOpen(false);
              onProfileUpdated?.();
            }}
          />
        )}
      </div>
    );
  }

  // ── Active / Paused care profile ──
  return (
    <div className="sticky top-24 space-y-3">
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Your Care Profile
              </h4>
              {acceptingMatches ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-50 border border-primary-100/60 text-[10px] font-semibold text-primary-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100/60 text-[10px] font-semibold text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Paused
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="min-h-[44px] px-2 -mr-2 text-[12px] font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-3 mb-4">
            {activeProfile.image_url ? (
              <Image
                src={activeProfile.image_url}
                alt=""
                width={44}
                height={44}
                sizes="44px"
                className="w-11 h-11 rounded-full object-cover border border-gray-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary-100/60 flex items-center justify-center text-[13px] font-bold text-primary-700">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-gray-900 truncate">
                {activeProfile.display_name || "Your name"}
              </p>
              <p className="text-[12px] text-gray-400 truncate flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {profileLocation || "Location not set"}
              </p>
            </div>
          </div>

          {/* Care type pills */}
          {careTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {careTypes.map((ct) => (
                <span
                  key={ct}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-warm-50 border border-warm-100/60 text-[11px] font-medium text-gray-600"
                >
                  {ct}
                </span>
              ))}
            </div>
          )}

          {/* Timeline + Payment row */}
          {(timelineDisplay || paymentDisplay) && (
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
              {timelineDisplay && (
                <span>{timelineDisplay}</span>
              )}
              {timelineDisplay && paymentDisplay && (
                <span className="text-gray-300 font-normal">·</span>
              )}
              {paymentDisplay && (
                <span>{paymentDisplay}</span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="border-t border-gray-100 px-5 py-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-gray-400">Providers interested</span>
            <span className="text-[13px] font-semibold text-gray-800">{interestedCount}</span>
          </div>
          {activeDays && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-400">Active for</span>
              <span className="text-[13px] font-semibold text-gray-800">
                {activeDays === 1 ? "1 day" : `${activeDays} days`}
              </span>
            </div>
          )}
        </div>

        {/* Actions section */}
        <div className="border-t border-gray-100 px-5 py-3.5 space-y-3">
          {/* Accepting new matches toggle */}
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-[14px] text-gray-600">Accepting new matches</span>
            <button
              type="button"
              role="switch"
              aria-checked={acceptingMatches}
              onClick={handleToggleAccepting}
              disabled={deactivating || publishing}
              className={[
                "relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50",
                acceptingMatches ? "bg-primary-500" : "bg-gray-200",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  acceptingMatches ? "translate-x-6" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>

          {/* Toggle notification — auto-dismisses */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
            style={{ gridTemplateRows: toggleMessage ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              {toggleMessage === "on" && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-primary-50/60 border border-primary-100/50 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 shrink-0 mt-0.5">
                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    Your profile is now visible. Providers can find and reach out to you.
                  </p>
                </div>
              )}
              {toggleMessage === "off" && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50/60 border border-amber-100/50 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-500 shrink-0 mt-0.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    New providers won&apos;t see your profile. Anyone who already reached out can still be reviewed.
                  </p>
                </div>
              )}
              {actionError && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50/60 border border-rose-100/50 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    {actionError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delete confirmation or delete link */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
            style={{ gridTemplateRows: showDeleteConfirm ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              {showDeleteConfirm && (
                <div className="rounded-xl border border-red-200/60 bg-red-50/30 px-4 py-4 mt-1 space-y-3">
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    <span className="font-semibold text-gray-900">Remove your care profile?</span>{" "}
                    Providers will no longer be able to find or reach out to you. Existing conversations are not affected.
                  </p>
                  <p className="text-[13px] font-medium text-gray-600">
                    Why are you removing it?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DELETE_REASONS.map((reason) => {
                      const isSelected = selectedDeleteReasons.includes(reason);
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => toggleDeleteReason(reason)}
                          className={[
                            "text-[13px] font-medium px-4 py-2.5 min-h-[44px] rounded-full border transition-all duration-150",
                            isSelected
                              ? "border-gray-300 bg-gray-100 text-gray-800"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setSelectedDeleteReasons([]);
                      }}
                      className="flex-1 min-h-[44px] py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Keep profile
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePost}
                      disabled={deleting}
                      className="flex-1 min-h-[44px] py-2 rounded-lg bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? "Removing..." : "Delete profile"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="min-h-[44px] px-2 -mx-2 text-[13px] text-gray-400 hover:text-red-600 transition-colors"
            >
              Delete profile
            </button>
          )}
        </div>
      </div>

      {/* Response time info card */}
      <div className="rounded-2xl border border-primary-100/60 bg-primary-50/40 px-4 py-3.5 flex items-start gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          {interestedCount > 0
            ? <>Take your time. There&apos;s <span className="font-semibold text-gray-800">no pressure</span> to respond immediately.</>
            : <>Most providers respond within <span className="font-semibold text-gray-800">3–5 days</span> of seeing a matching profile.</>
          }
        </p>
      </div>

      {/* Edit care profile modal */}
      {editModalOpen && (
        <EditCarePostModal
          profile={activeProfile}
          userEmail={userEmail}
          onClose={() => setEditModalOpen(false)}
          onSaved={() => {
            setEditModalOpen(false);
            onProfileUpdated?.();
          }}
        />
      )}
    </div>
  );
}
