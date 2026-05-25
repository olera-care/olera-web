"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { useProfileCompleteness, type SectionStatus } from "./completeness";
import { BenefitsFinderBanner } from "./ProfileEditContent";
import ProfileEditSheet, { type EditSection } from "./ProfileEditSheet";
import CarePostSidebar from "@/components/portal/profile/CarePostSidebar";

// Mobile tab type
type MobileTab = "profile" | "care-post";

// ── Constants ──

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "As soon as possible",
  within_1_month: "Within a month",
  within_3_months: "In a few months",
  exploring: "Just researching",
};

const CONTACT_PREF_LABELS: Record<string, string> = {
  call: "Phone call",
  text: "Text message",
  email: "Email",
};

const SCHEDULE_LABELS: Record<string, string> = {
  mornings: "Mornings",
  afternoons: "Afternoons",
  evenings: "Evenings",
  overnight: "Overnight",
  full_time: "Full-time / Live-in",
  flexible: "Flexible",
};

// Section to edit - matches ProfileEditSheet sections

// ── Main Component ──

interface FamilyProfileViewProps {
  /** Override the profile to render. Falls back to activeProfile from context. */
  profile?: BusinessProfile | null;
}

export default function FamilyProfileView({ profile: profileProp }: FamilyProfileViewProps = {}) {
  const { user, activeProfile, refreshAccountData } = useAuth();
  const [editingSection, setEditingSection] = useState<EditSection | null>(null);
  const [activatingProfile, setActivatingProfile] = useState(false);

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<MobileTab>("profile");

  const profile = (profileProp ?? activeProfile) as BusinessProfile;
  const meta = (profile?.metadata || {}) as FamilyMetadata;
  const userEmail = user?.email || "";

  const { percentage, sectionStatus } = useProfileCompleteness(profile, userEmail);

  const openSection = (section: EditSection) => {
    setEditingSection(section);
  };

  const handleSheetClose = () => {
    setEditingSection(null);
  };

  const handleSheetSaved = () => {
    setEditingSection(null);
    refreshAccountData();
  };

  const handleNavigateToSection = (nextSection: EditSection) => {
    // This will cause a remount due to key={editingSection}
    setEditingSection(nextSection);
  };

  // ── Care Profile (Matches) handlers ──
  const handlePublish = useCallback(async () => {
    const res = await fetch("/api/care-post/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    if (!res.ok) throw new Error("Failed to publish");
    await refreshAccountData();
  }, [refreshAccountData]);

  const handleDeactivate = useCallback(async () => {
    const res = await fetch("/api/care-post/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate" }),
    });
    if (!res.ok) throw new Error("Failed to deactivate");
    await refreshAccountData();
  }, [refreshAccountData]);

  const handleDelete = useCallback(async (reasons: string[]) => {
    const res = await fetch("/api/care-post/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", reasons }),
    });
    if (!res.ok) throw new Error("Failed to delete");
    await refreshAccountData();
  }, [refreshAccountData]);

  // Check if profile has minimum data to go live
  const hasLocation = Boolean(profile?.city && profile?.state);
  const hasCareTypes = Boolean(profile?.care_types && profile.care_types.length > 0);
  const canGoLive = hasLocation && hasCareTypes;

  // Check if profile is live or paused
  const carePost = meta.care_post as { status?: string; published_at?: string } | undefined;
  const isLive = carePost?.status === "active";
  const isPaused = carePost?.status === "paused";

  const handleQuickGoLive = useCallback(async () => {
    if (!canGoLive) return;
    setActivatingProfile(true);
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
      await refreshAccountData();
    } finally {
      setActivatingProfile(false);
    }
  }, [canGoLive, profile?.city, profile?.state, refreshAccountData]);

  if (!profile) return null;

  // ── Derived display values ──
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const careTypesDisplay = profile.care_types?.length ? profile.care_types.join(", ") : null;
  const careNeedsDisplay = meta.care_needs?.length ? meta.care_needs.join(", ") : null;
  const timelineDisplay = meta.timeline ? TIMELINE_LABELS[meta.timeline] || meta.timeline : null;
  const scheduleDisplay = meta.schedule_preference ? SCHEDULE_LABELS[meta.schedule_preference] || meta.schedule_preference : null;
  const contactPrefDisplay = meta.contact_preference ? CONTACT_PREF_LABELS[meta.contact_preference] || meta.contact_preference : null;
  const descriptionDisplay = meta.about_situation || profile.description || null;
  const ageDisplay = meta.age ? `${meta.age} years old` : null;

  // Count interested providers (for sidebar display)
  const interestedCount = 0; // We don't have this data here, sidebar will show 0

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* Profile Edit Sheet - key forces remount when section changes to ensure fresh state */}
      {editingSection && (
        <ProfileEditSheet
          key={editingSection}
          isOpen={true}
          section={editingSection}
          profile={profile}
          userEmail={userEmail}
          onClose={handleSheetClose}
          onSaved={handleSheetSaved}
          onNavigateToSection={handleNavigateToSection}
        />
      )}

      {/* ── Mobile Tab Bar (pill style, full-width) ── */}
      <div className="lg:hidden mb-5">
        <div className="flex items-center p-1 bg-gray-100 rounded-full">
          <button
            type="button"
            onClick={() => setMobileTab("profile")}
            className={[
              "flex-1 py-2.5 text-[14px] font-medium rounded-full transition-all text-center",
              mobileTab === "profile"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("care-post")}
            className={[
              "flex-1 py-2.5 text-[14px] font-medium rounded-full transition-all flex items-center justify-center gap-2",
              mobileTab === "care-post"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            Care Post
            {isLive ? (
              <span className={[
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                mobileTab === "care-post"
                  ? "bg-emerald-400/20 text-emerald-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200",
              ].join(" ")}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : isPaused ? (
              <span className={[
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                mobileTab === "care-post"
                  ? "bg-amber-400/20 text-amber-200"
                  : "bg-amber-50 text-amber-600 border border-amber-200",
              ].join(" ")}>
                Paused
              </span>
            ) : canGoLive ? (
              <span className={[
                "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                mobileTab === "care-post"
                  ? "bg-primary-400/20 text-primary-200"
                  : "bg-primary-50 text-primary-700 border border-primary-200",
              ].join(" ")}>
                Ready
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Left column - Profile card (hidden on mobile when Care Post tab is active) */}
      <div className={`flex-1 ${mobileTab === "care-post" ? "hidden lg:block" : ""}`}>
        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm divide-y divide-gray-100">
        {/* ── Profile Header ── */}
        <div className="p-5 sm:p-6">
          {/* Mobile: Stacked layout */}
          <div className="flex flex-col items-center text-center sm:hidden">
            {/* Avatar */}
            <button
              type="button"
              onClick={() => openSection("info")}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-50 ring-[3px] ring-gray-100 shadow-sm flex items-center justify-center mb-4 hover:ring-primary-200 transition-all group"
            >
              {profile.image_url ? (
                <>
                  <Image src={profile.image_url} alt={profile.display_name || "Profile"} width={96} height={96} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-primary-600 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </button>

            {/* Name and details */}
            <h2 className="text-xl font-display font-bold text-gray-900 tracking-tight mb-1">
              {profile.display_name || "Your Name"}
            </h2>
            <p className="text-[14px] text-gray-500 mb-3">
              {location || "Location not set"}
              <span className="mx-1.5 text-gray-300">&middot;</span>
              Family care seeker
            </p>

            {/* Progress bar */}
            {percentage < 100 && (
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${percentage >= 80 ? "bg-gray-700" : "bg-warning-400"}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${percentage >= 80 ? "text-gray-600" : "text-warning-600"}`}>
                  {percentage}%
                </span>
              </div>
            )}

            {/* Edit Profile button - mobile */}
            <button
              type="button"
              onClick={() => openSection("info")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Profile
            </button>

          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden sm:flex items-center gap-5">
            <button
              type="button"
              onClick={() => openSection("info")}
              className="shrink-0 relative group"
            >
              <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gray-50 ring-[3px] ring-gray-100 hover:ring-primary-200 shadow-xs flex items-center justify-center transition-all">
                {profile.image_url ? (
                  <Image src={profile.image_url} alt={profile.display_name || "Profile"} width={88} height={88} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-primary-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-display font-bold text-gray-900 truncate tracking-tight">
                {profile.display_name || "Your Name"}
              </h2>
              <p className="text-base text-gray-500 mt-1">
                {location || "Location not set"}
                <span className="mx-1.5 text-gray-300">&middot;</span>
                Family care seeker
              </p>
              {percentage < 100 && (
                <div className="flex items-center gap-2.5 mt-2.5">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${percentage >= 80 ? "bg-gray-700" : "bg-warning-400"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${percentage >= 80 ? "text-gray-600" : "text-warning-600"}`}>
                    {percentage}%
                  </span>
                </div>
              )}
            </div>

            {/* Edit Profile button - desktop */}
            <button
              type="button"
              onClick={() => openSection("info")}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Profile
            </button>

          </div>
        </div>

        {/* ── Contact Information ── */}
        <SectionCard
          title="Contact Information"
          status={sectionStatus[1]}
          onEdit={() => openSection("contact")}
        >
          <div className="divide-y divide-gray-50">
            <ViewRow label="Email" value={profile.email || userEmail || null} />
            <ViewRow label="Phone" value={profile.phone} />
            <ViewRow label="Preferred contact method" value={contactPrefDisplay} />
          </div>
        </SectionCard>

        {/* ── Care Recipient ── */}
        <SectionCard
          title="Care Recipient"
          status={sectionStatus[2]}
          onEdit={() => openSection("recipient")}
        >
          <div className="divide-y divide-gray-50">
            <ViewRow label="Who needs care" value={meta.relationship_to_recipient || null} />
            <ViewRow label="Age" value={ageDisplay} />
            {descriptionDisplay && (
              <div className="py-3">
                <p className="text-[13px] font-medium text-gray-500">About the situation</p>
                <p className="text-[15px] text-gray-900 mt-0.5 whitespace-pre-wrap">{descriptionDisplay}</p>
              </div>
            )}
            {!descriptionDisplay && <ViewRow label="About the situation" value={null} />}
          </div>
        </SectionCard>

        {/* ── Care Needs ── */}
        <SectionCard
          title="Care Needs"
          status={sectionStatus[3]}
          onEdit={() => openSection("needs")}
        >
          <div className="divide-y divide-gray-50">
            <ViewRow label="Type of care" value={careTypesDisplay} />
            <ViewRow label="Help needed" value={careNeedsDisplay} />
            <ViewRow label="Timeline" value={timelineDisplay} />
            <ViewRow label="Schedule" value={scheduleDisplay} />
          </div>
        </SectionCard>

        {/* ── Payment & Benefits ── */}
        <SectionCard
          title="Payment & Benefits"
          status={sectionStatus[4]}
          onEdit={() => openSection("payment")}
        >
          {meta.payment_methods && meta.payment_methods.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {meta.payment_methods.map((method) => (
                <span key={method} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#F5F4F1] text-gray-700">
                  {method}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-4">Not added</p>
          )}
          {meta.saved_benefits && meta.saved_benefits.length > 0 && (
            <div className="mb-4">
              <p className="text-[13px] font-medium text-gray-500 mb-2">Saved benefits</p>
              <div className="flex flex-wrap gap-2">
                {meta.saved_benefits.map((benefit) => (
                  <span key={benefit} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
          <BenefitsFinderBanner />
        </SectionCard>
        </div>
      </div>

      {/* ── Mobile Care Post Tab Content ── */}
      {mobileTab === "care-post" && (
        <div className="lg:hidden">
          <MobileCarePostContent
            profile={profile}
            meta={meta}
            carePost={carePost}
            isLive={isLive}
            isPaused={isPaused}
            canGoLive={canGoLive}
            activatingProfile={activatingProfile}
            onGoLive={handleQuickGoLive}
            onPublish={handlePublish}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
            onEdit={() => openSection("info")}
            interestedCount={interestedCount}
          />
        </div>
      )}

      {/* Right column - Matches control sidebar (desktop only) */}
      <div className="hidden lg:block lg:w-[360px] lg:shrink-0 mt-6 lg:mt-0">
        <CarePostSidebar
          activeProfile={profile}
          interestedCount={interestedCount}
          userEmail={userEmail}
          onPublish={handlePublish}
          onDeactivate={handleDeactivate}
          onDelete={handleDelete}
          onProfileUpdated={refreshAccountData}
          canGoLive={canGoLive}
          onGoLive={handleQuickGoLive}
          activating={activatingProfile}
          onEdit={() => openSection("info")}
        />
      </div>
    </div>
  );
}

// ── Helper Components ──

function SectionBadge({ status }: { status: SectionStatus | undefined }) {
  if (!status || status === "complete") {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-50">
        <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  const label = status === "empty" ? "Not added" : "Incomplete";
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
      {label}
    </span>
  );
}

function SectionCard({
  title,
  status,
  onEdit,
  children,
}: {
  title: string;
  status: SectionStatus | undefined;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const editLabel = status === "empty" ? "Add" : "Edit";

  return (
    <div className="p-5 sm:p-6 group">
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-4">
        <h3 className="text-lg font-display font-bold text-gray-900">{title}</h3>
        <SectionBadge status={status} />
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto text-[14px] font-medium text-primary-600 hover:text-primary-700 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
        >
          {editLabel} &rarr;
        </button>
      </div>

      {/* View content */}
      {children}
    </div>
  );
}

function ViewRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="py-3">
      <p className="text-[13px] font-medium text-gray-500">{label}</p>
      {value ? (
        <p className="text-[15px] text-gray-900 mt-0.5">{value}</p>
      ) : (
        <p className="text-sm text-gray-400 italic mt-0.5">Not added</p>
      )}
    </div>
  );
}

// ── Delete Reasons ──
const DELETE_REASONS = [
  "Found care",
  "Not ready yet",
  "Too many contacts",
  "Other",
];

// ── Mobile Care Post Content ──

interface MobileCarePostContentProps {
  profile: BusinessProfile;
  meta: FamilyMetadata;
  carePost: { status?: string; published_at?: string } | undefined;
  isLive: boolean;
  isPaused: boolean;
  canGoLive: boolean;
  activatingProfile: boolean;
  onGoLive: () => Promise<void>;
  onPublish: () => Promise<void>;
  onDeactivate: () => Promise<void>;
  onDelete: (reasons: string[]) => Promise<void>;
  onEdit: () => void;
  interestedCount: number;
}

function MobileCarePostContent({
  profile,
  meta,
  carePost,
  isLive,
  isPaused,
  canGoLive,
  activatingProfile,
  onGoLive,
  onPublish,
  onDeactivate,
  onDelete,
  onEdit,
  interestedCount,
}: MobileCarePostContentProps) {
  const [publishing, setPublishing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [acceptingMatches, setAcceptingMatches] = useState(isLive);
  const [toggleMessage, setToggleMessage] = useState<"on" | "off" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDeleteReasons, setSelectedDeleteReasons] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasPost = isLive || isPaused;

  // Sync acceptingMatches with external isLive changes
  useEffect(() => {
    setAcceptingMatches(isLive);
  }, [isLive]);

  // Auto-dismiss toggle message
  useEffect(() => {
    if (!toggleMessage) return;
    const timer = setTimeout(() => setToggleMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toggleMessage]);

  // Auto-dismiss error
  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), 4000);
    return () => clearTimeout(timer);
  }, [actionError]);

  // Derived display values
  const profileLocation =
    profile.city && profile.state
      ? `${profile.city}, ${profile.state}`
      : null;

  const careTypes = profile.care_types?.length
    ? profile.care_types.map((ct) =>
        ct.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      )
    : [];

  const timelineDisplay = meta.timeline
    ? meta.timeline.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const paymentDisplay = meta.payment_methods?.length
    ? meta.payment_methods[0]
    : null;

  const activeDays = carePost?.published_at
    ? Math.max(1, Math.floor((Date.now() - new Date(carePost.published_at).getTime()) / 86400000))
    : null;

  const initials = profile.display_name
    ? profile.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Handlers
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
      setAcceptingMatches(false);
      setToggleMessage("off");
      await handleDeactivateAction();
    } else {
      setAcceptingMatches(true);
      setToggleMessage("on");
      await handlePublishAction();
    }
  }, [acceptingMatches, handleDeactivateAction, handlePublishAction]);

  const toggleDeleteReason = (reason: string) => {
    setSelectedDeleteReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      await onDelete(selectedDeleteReasons);
      setShowDeleteConfirm(false);
      setSelectedDeleteReasons([]);
    } catch {
      setActionError("Couldn't delete. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Not Published State ──
  if (!hasPost) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          {/* Illustration - same as enrichment Go Live step */}
          <div className="w-32 h-32 mx-auto mb-4 relative">
            <Image
              src="/illustration-go-live.png"
              alt="Let care come to you"
              fill
              className="object-contain"
            />
          </div>

          {/* Headline */}
          <h3 className="text-[18px] font-bold text-gray-900 mb-2">
            Let care come to you
          </h3>
          <p className="text-[14px] text-gray-500 mb-6 max-w-[260px] mx-auto">
            Providers who match your needs will reach out directly.
          </p>

          {/* Go Live button */}
          {canGoLive ? (
            <button
              type="button"
              onClick={onGoLive}
              disabled={activatingProfile}
              className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-[15px] font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 touch-manipulation"
            >
              {activatingProfile ? (
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
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 text-[15px] font-semibold cursor-not-allowed"
              >
                Go Live
              </button>
              <p className="text-[13px] text-gray-500">
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors touch-manipulation"
                >
                  Complete your profile
                </button>
                {" "}to go live
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Published State (Live or Paused) ──
  return (
    <div className="space-y-4">
      {/* Unified Care Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Header with status + Edit */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Your Care Profile
              </h4>
              {acceptingMatches ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              onClick={onEdit}
              className="min-h-[44px] px-2 -mr-2 text-[12px] font-medium text-primary-600 hover:text-primary-700 active:text-primary-800 transition-colors flex items-center gap-1"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-3.5 mb-4">
            {profile.image_url ? (
              <Image
                src={profile.image_url}
                alt=""
                width={52}
                height={52}
                sizes="52px"
                className="w-[52px] h-[52px] rounded-full object-cover border border-gray-100"
              />
            ) : (
              <div className="w-[52px] h-[52px] rounded-full bg-primary-100/60 flex items-center justify-center text-[14px] font-bold text-primary-700">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold text-gray-900 truncate">
                {profile.display_name || "Your name"}
              </p>
              <p className="text-[13px] text-gray-500 truncate flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
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
              {timelineDisplay && <span>{timelineDisplay}</span>}
              {timelineDisplay && paymentDisplay && <span className="text-gray-300 font-normal">·</span>}
              {paymentDisplay && <span>{paymentDisplay}</span>}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Providers interested</p>
              <p className="text-[20px] font-bold text-gray-900 tabular-nums">{interestedCount}</p>
            </div>
            {activeDays && (
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Active for</p>
                <p className="text-[20px] font-bold text-gray-900 tabular-nums">
                  {activeDays === 1 ? "1 day" : `${activeDays} days`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Accepting toggle - integrated */}
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-gray-900">Accepting new matches</p>
              <p className="text-[12px] text-gray-500">
                {acceptingMatches ? "Providers can find you" : "Hidden from search"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={acceptingMatches}
              onClick={handleToggleAccepting}
              disabled={deactivating || publishing}
              className={[
                "relative inline-flex h-7 w-[50px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 touch-manipulation",
                acceptingMatches ? "bg-primary-500" : "bg-gray-200",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  acceptingMatches ? "translate-x-[22px]" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>

          {/* Toggle feedback messages */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
            style={{ gridTemplateRows: toggleMessage || actionError ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              {toggleMessage === "on" && (
                <p className="text-[13px] text-primary-600 mt-2">
                  Your profile is now visible to providers.
                </p>
              )}
              {toggleMessage === "off" && (
                <p className="text-[13px] text-amber-600 mt-2">
                  Your profile is hidden from search.
                </p>
              )}
              {actionError && (
                <p className="text-[13px] text-rose-600 mt-2">
                  {actionError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Delete - subtle text link */}
        <div className="border-t border-gray-100">
          {/* Delete confirmation */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
            style={{ gridTemplateRows: showDeleteConfirm ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              {showDeleteConfirm && (
                <div className="px-5 py-4 space-y-4 bg-gray-50/50">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900 mb-1">Remove your care profile?</p>
                    <p className="text-[13px] text-gray-500">
                      Providers won&apos;t be able to find you anymore.
                    </p>
                  </div>

                  <div>
                    <p className="text-[12px] font-medium text-gray-600 mb-2">Why are you removing it?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DELETE_REASONS.map((reason) => {
                        const isSelected = selectedDeleteReasons.includes(reason);
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => toggleDeleteReason(reason)}
                            className={[
                              "text-[12px] font-medium px-3 py-2 rounded-full border transition-all duration-150 touch-manipulation",
                              isSelected
                                ? "border-gray-300 bg-gray-100 text-gray-800"
                                : "border-gray-200 bg-white text-gray-600",
                            ].join(" ")}
                          >
                            {reason}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setSelectedDeleteReasons([]);
                      }}
                      className="flex-1 py-2.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePost}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-[13px] font-semibold disabled:opacity-50 touch-manipulation"
                    >
                      {deleting ? "Removing..." : "Delete"}
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
              className="w-full py-3 text-[13px] text-gray-400 hover:text-red-500 transition-colors text-center touch-manipulation"
            >
              Delete profile
            </button>
          )}
        </div>
      </div>

      {/* Info disclaimer - simple and subtle */}
      <p className="text-[13px] text-gray-500 text-center px-4">
        {interestedCount > 0
          ? "Take your time reviewing interested providers."
          : "Providers typically respond within 3–5 days."}
      </p>
    </div>
  );
}
