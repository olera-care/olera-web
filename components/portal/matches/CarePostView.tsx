"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { useProfileCompleteness } from "@/components/portal/profile/completeness";

interface CarePostViewProps {
  activeProfile: BusinessProfile;
  userEmail?: string;
  onPublish: () => Promise<void>;
  onDeactivate: () => Promise<void>;
  /** Start directly in "review" mode (skip the empty state) */
  initialStep?: "empty" | "review" | "active";
  /** Called when user clicks "Back" from the review step */
  onBack?: () => void;
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#199087"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#199087"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function CarePostView({
  activeProfile,
  userEmail,
  onPublish,
  onDeactivate,
  initialStep,
  onBack,
}: CarePostViewProps) {
  const meta = (activeProfile.metadata || {}) as FamilyMetadata;
  const carePost = meta.care_post;
  const isActive = carePost?.status === "active";

  // Local UI step: empty → review → active
  const [step, setStep] = useState<"empty" | "review" | "active">(
    initialStep || (isActive ? "active" : "empty")
  );
  const [publishing, setPublishing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const { percentage } = useProfileCompleteness(activeProfile, userEmail);

  const profileLocation =
    activeProfile.city && activeProfile.state
      ? `${activeProfile.city}, ${activeProfile.state}`
      : null;

  const careTypeDisplay = activeProfile.care_types?.length
    ? activeProfile.care_types
        .map((ct) =>
          ct
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        )
        .join(", ")
    : null;

  const timelineDisplay = meta.timeline
    ? meta.timeline
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const paymentDisplay = meta.payment_methods?.length
    ? meta.payment_methods.join(", ")
    : null;

  const notesDisplay =
    meta.about_situation || activeProfile.description || null;

  const relationshipDisplay = meta.relationship_to_recipient
    ? meta.relationship_to_recipient
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const scheduleDisplay = meta.schedule_preference || null;

  // Fields for review & active views
  const reviewFields = [
    { label: "Care type", value: careTypeDisplay, required: true },
    { label: "Care for", value: relationshipDisplay },
    { label: "Location", value: profileLocation, required: true },
    { label: "Timeline", value: timelineDisplay, required: true },
    { label: "Payment", value: paymentDisplay },
    { label: "Notes", value: notesDisplay },
    { label: "Phone", value: activeProfile.phone },
    { label: "Schedule", value: scheduleDisplay },
  ];

  const activeFields = [
    { label: "Care type", value: careTypeDisplay },
    { label: "Location", value: profileLocation },
    { label: "Timeline", value: timelineDisplay },
    { label: "Payment", value: paymentDisplay },
    { label: "Notes", value: notesDisplay },
  ];

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish();
      setStep("active");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await onDeactivate();
      setStep("empty");
    } finally {
      setDeactivating(false);
    }
  };

  // ── EMPTY STATE ──
  if (step === "empty") {
    return (
      <div>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div
            className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ animation: "emptyFloat 3s ease-in-out infinite" }}
          >
            📣
          </div>
          <style jsx>{`
            @keyframes emptyFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}</style>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Let providers find you
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-[380px] mx-auto">
            Share your care profile so qualified providers in your area can reach
            out to you directly.
          </p>
          <Button size="sm" onClick={() => setStep("review")}>
            Share Care Profile
          </Button>
        </div>
      </div>
    );
  }

  // ── REVIEW STATE ──
  if (step === "review") {
    const initials = activeProfile.display_name
      ? activeProfile.display_name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

    return (
      <div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
          {/* Sticky header */}
          <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100 bg-white">
            <button
              onClick={() => onBack ? onBack() : setStep("empty")}
              className="flex items-center gap-1.5 mb-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Review your care profile
            </h3>
            <p className="text-sm text-gray-500">
              This is what providers will see.
            </p>
          </div>

          {/* Scrollable content with inset shadows */}
          <div
            className="flex-1 overflow-y-auto min-h-0"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0px, black 8px, black calc(100% - 8px), transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 8px, black calc(100% - 8px), transparent 100%)",
            }}
          >
            {/* Profile header */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 border-2 border-dashed border-gray-300">
                  {initials}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {activeProfile.display_name || "Your name"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profileLocation || "Location not set"} · Family care seeker
                  </p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="px-6 pb-5">
              {reviewFields.map((f, i) => (
                <div
                  key={i}
                  className={[
                    "flex items-start justify-between py-2.5",
                    i < reviewFields.length - 1
                      ? "border-b border-gray-100"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">{f.label}</span>
                      {f.required && (
                        <span className="text-[9px] text-amber-600 font-bold">
                          REQUIRED
                        </span>
                      )}
                    </div>
                    <p
                      className={[
                        "text-sm mt-0.5",
                        f.value
                          ? "text-gray-800 font-medium"
                          : "text-gray-400 italic",
                      ].join(" ")}
                    >
                      {f.value || "Not set yet"}
                    </p>
                  </div>
                  {f.value ? (
                    <CheckIcon />
                  ) : (
                    <Link
                      href="/portal/profile"
                      className="text-xs text-primary-600 font-semibold hover:text-primary-700"
                    >
                      + Add
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sticky footer — always visible */}
          <div className="flex-shrink-0 border-t border-gray-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]">
            {/* Completeness + privacy */}
            <div className="px-6 pt-3 pb-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  {percentage}% complete
                </span>
                <Link
                  href="/portal/profile"
                  className="text-xs text-primary-600 font-medium ml-auto underline underline-offset-2 decoration-primary-600/30 hover:text-primary-700"
                >
                  Edit profile
                </Link>
              </div>

              <div className="flex items-start gap-2 px-3.5 py-2.5 bg-primary-50/60 rounded-xl border border-primary-100/50">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-600 flex-shrink-0 mt-0.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your contact details are kept private. Providers can only
                  message you through Olera.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              {!reviewFields.filter((f) => f.required).every((f) => f.value) && (
                <p className="text-xs text-amber-600 font-medium text-center mb-2.5">
                  Complete all required fields to publish
                </p>
              )}
              <Button
                size="sm"
                onClick={handlePublish}
                loading={publishing}
                disabled={!reviewFields.filter((f) => f.required).every((f) => f.value)}
                className="w-full"
              >
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE STATE ──
  const publishedDate = carePost?.published_at
    ? new Date(carePost.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
        {/* Sticky header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-600" />
              <span className="text-sm font-semibold text-primary-600">
                Active care profile
              </span>
            </div>
            <span className="text-xs text-gray-400">Posted {publishedDate}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {careTypeDisplay || "Care"} for{" "}
            {relationshipDisplay?.toLowerCase() || "a loved one"}
          </h3>
          <p className="text-sm text-gray-500">
            {profileLocation || "Location not set"}
            {timelineDisplay && ` · Needed ${timelineDisplay.toLowerCase()}`}
          </p>
        </div>

        {/* Scrollable content with inset shadows */}
        <div
          className="flex-1 overflow-y-auto min-h-0"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0px, black 8px, black calc(100% - 8px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 8px, black calc(100% - 8px), transparent 100%)",
          }}
        >
          <div className="px-6 py-5">
            {/* Details */}
            <div className="flex flex-col gap-2.5">
              {activeFields.map((f, i) => (
                <div
                  key={i}
                  className={[
                    "flex justify-between items-start py-2",
                    i < activeFields.length - 1
                      ? "border-b border-gray-100"
                      : "",
                  ].join(" ")}
                >
                  <span className="text-xs text-gray-400 min-w-[80px]">
                    {f.label}
                  </span>
                  <span className="text-sm text-gray-800 font-medium text-right flex-1">
                    {f.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky footer — always visible */}
        <div className="flex-shrink-0 border-t border-gray-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]">
          <div className="px-6 pt-4 pb-3">
            {/* Completeness */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-primary-50 rounded-lg">
              <div className="w-10 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-primary-600 font-semibold">
                {percentage}% profile shared
              </span>
              <Link
                href="/portal/profile"
                className="text-xs text-primary-600 font-medium ml-auto underline underline-offset-2 decoration-primary-600/30 hover:text-primary-700"
              >
                Edit profile
              </Link>
            </div>
          </div>

          {/* Edit / Deactivate buttons */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-2.5 rounded-b-2xl">
            <Link href="/portal/profile" className="flex-1">
              <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <PencilIcon /> Edit profile
              </button>
            </Link>
            <button
              onClick={handleDeactivate}
              disabled={deactivating}
              className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-red-800 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deactivating ? "..." : "Deactivate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
