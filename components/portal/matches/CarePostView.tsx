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
}: CarePostViewProps) {
  const meta = (activeProfile.metadata || {}) as FamilyMetadata;
  const carePost = meta.care_post;
  const isActive = carePost?.status === "active";

  // Local UI step: empty → review → active
  const [step, setStep] = useState<"empty" | "review" | "active">(
    isActive ? "active" : "empty"
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
      <div className="max-w-[560px]">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-3xl mx-auto mb-4">
            📣
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Let providers find you
          </h3>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed max-w-[380px] mx-auto">
            Post your care need and qualified providers in your area can reach
            out to you directly.
          </p>
          <p className="text-sm text-gray-400 mb-6 max-w-[380px] mx-auto">
            Your existing profile details will be used — no extra forms to fill
            out.
          </p>
          <Button size="sm" onClick={() => setStep("review")}>
            Create Care Post
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
      <div className="max-w-[560px]">
        {/* Back button */}
        <button
          onClick={() => setStep("empty")}
          className="flex items-center gap-1.5 mb-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
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

        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Review your care post
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          This is what providers will see. Make sure everything looks right
          before publishing.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Profile header */}
          <div className="px-6 py-5 border-b border-gray-100">
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
          <div className="px-6 py-5">
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

          {/* Completeness + privacy */}
          <div className="px-6 pb-5">
            <div className="flex items-center gap-2 px-3.5 py-3 bg-primary-50 rounded-xl mb-3">
              <div className="w-9 h-1.5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-primary-600 font-semibold">
                {percentage}% complete
              </span>
              <Link
                href="/portal/profile"
                className="text-xs text-primary-600 font-medium ml-auto underline underline-offset-2 decoration-primary-600/30 hover:text-primary-700"
              >
                Edit profile
              </Link>
            </div>

            <div className="flex items-start gap-2 px-3.5 py-2.5 bg-amber-50/50 rounded-xl border border-amber-100/50">
              <span className="text-sm flex-shrink-0">👁</span>
              <p className="text-xs text-gray-600 leading-relaxed">
                Providers in your area who match your care type will see this
                post. Your email and phone are only shared when you accept a
                connection.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("empty")}
              className="flex-1 border border-gray-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              loading={publishing}
              className="flex-[2]"
            >
              Publish Post
            </Button>
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
    <div className="max-w-[560px]">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-600" />
          <span className="text-sm font-semibold text-primary-600">
            Active care post
          </span>
        </div>
        <span className="text-xs text-gray-400">Posted {publishedDate}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {careTypeDisplay || "Care"} for{" "}
            {relationshipDisplay?.toLowerCase() || "a loved one"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {profileLocation || "Location not set"}
            {timelineDisplay && ` · Needed ${timelineDisplay.toLowerCase()}`}
          </p>

          {/* Details */}
          <div className="flex flex-col gap-2.5 mb-4">
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

          {/* Completeness */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-primary-50 rounded-lg mb-4">
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

          {/* Edit / Deactivate buttons */}
          <div className="flex gap-2.5">
            <Link href="/portal/profile" className="flex-1">
              <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <PencilIcon /> Edit post
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

        {/* View connections link */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <Link
            href="/portal/connections"
            className="block w-full text-center px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
          >
            View all in My Connections →
          </Link>
        </div>
      </div>
    </div>
  );
}
