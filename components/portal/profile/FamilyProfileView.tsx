"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { useProfileCompleteness, type SectionStatus } from "./completeness";
import ProfileEditContent, { BenefitsFinderBanner } from "./ProfileEditContent";
import SplitViewLayout from "@/components/portal/SplitViewLayout";

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

export default function FamilyProfileView() {
  const { user, activeProfile, refreshAccountData } = useAuth();
  const [editStep, setEditStep] = useState<number | null>(null);

  const profile = activeProfile as BusinessProfile;
  const meta = (profile?.metadata || {}) as FamilyMetadata;
  const userEmail = user?.email || "";

  const { percentage, sectionStatus } = useProfileCompleteness(
    profile,
    userEmail
  );

  if (!profile) return null;

  const openEdit = (step: number) => {
    setEditStep(step);
  };

  const handleSaved = async () => {
    await refreshAccountData();
  };

  // --- Derived display values ---
  const location = [profile.city, profile.state, meta.country].filter(Boolean).join(", ");
  const careTypesDisplay = profile.care_types?.length
    ? profile.care_types.join(", ")
    : null;
  const timelineDisplay = meta.timeline
    ? TIMELINE_LABELS[meta.timeline] || meta.timeline
    : null;

  /** Combine steps 4+5+6 into a single "More About" section status */
  const combineSectionStatus = (): SectionStatus => {
    const statuses = [sectionStatus[4], sectionStatus[5], sectionStatus[6]].filter(Boolean);
    if (statuses.length === 0) return "empty";
    if (statuses.every((s) => s === "complete")) return "complete";
    if (statuses.every((s) => s === "empty")) return "empty";
    return "incomplete";
  };

  return (
    <SplitViewLayout
      selectedId={editStep !== null ? String(editStep) : null}
      onBack={() => setEditStep(null)}
      backLabel="Back to profile"
      expandWhenEmpty
      equalWidth
      left={
        <div className="h-full overflow-y-auto px-8 py-6">
        <div className="space-y-5 max-w-2xl">
      {/* ── Page Title ── */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Your personal information and care preferences.</p>
      </div>

      {/* ── Profile Header ── */}
      <section className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <div className="p-6 flex items-center gap-5">
          {/* Avatar (view-only — edit via Edit panel) */}
          <div className="shrink-0">
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gray-50 ring-[3px] ring-gray-100 shadow-xs flex items-center justify-center">
              {profile.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-0.5 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Name + location */}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 truncate tracking-tight">
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
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage >= 80 ? "bg-primary-500" : "bg-warning-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  percentage >= 80 ? "text-primary-600" : "text-warning-600"
                }`}>
                  {percentage}%
                </span>
              </div>
            )}
          </div>

          {/* Edit basic info */}
          <button
            type="button"
            onClick={() => openEdit(0)}
            className="shrink-0 self-start mt-1 text-[14px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Edit
          </button>
        </div>

      </section>

      {/* ── Contact Information ── */}
      <SectionCard
        title="Contact Information"
        status={sectionStatus[1]}
        onEdit={() => openEdit(1)}
      >
        <div className="divide-y divide-gray-50">
          <ViewRow label="Email" value={profile.email || userEmail || null} />
          <ViewRow label="Phone" value={profile.phone} />
          <ViewRow
            label="Preferred contact method"
            value={
              meta.contact_preference
                ? CONTACT_PREF_LABELS[meta.contact_preference] ||
                  meta.contact_preference
                : null
            }
          />
        </div>
      </SectionCard>

      {/* ── Care Preferences ── */}
      <SectionCard
        title="Care Preferences"
        status={sectionStatus[2]}
        onEdit={() => openEdit(2)}
      >
        <div className="divide-y divide-gray-50">
          <ViewRow label="Who needs care" value={meta.relationship_to_recipient || null} />
          <ViewRow label="Age of person needing care" value={meta.age ? String(meta.age) : null} />
          <ViewRow label="Type of care" value={careTypesDisplay} />
          <ViewRow label="Care needs" value={meta.care_needs && meta.care_needs.length > 0 ? meta.care_needs.join(", ") : null} />
          <ViewRow label="Timeline" value={timelineDisplay} />
          <ViewRow label="Additional notes" value={profile.description || null} />
        </div>
      </SectionCard>

      {/* ── Payment & Benefits ── */}
      <SectionCard
        title="Payment & Benefits"
        status={sectionStatus[3]}
        onEdit={() => openEdit(3)}
      >
        {meta.payment_methods && meta.payment_methods.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {meta.payment_methods.map((method) => (
              <span
                key={method}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-50 text-primary-700"
              >
                {method}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-gray-300 mb-4">&mdash;</p>
        )}
        {meta.saved_benefits && meta.saved_benefits.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Saved Benefits
            </p>
            <div className="flex flex-wrap gap-2">
              {meta.saved_benefits.map((benefit) => (
                <span
                  key={benefit}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-50 text-gray-600 border border-gray-200"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}
        <BenefitsFinderBanner />
      </SectionCard>

      {/* ── More About Your Situation ── */}
      <SectionCard
        title="More About Your Situation"
        status={combineSectionStatus()}
        onEdit={() => openEdit(4)}
      >
        <div className="divide-y divide-gray-50">
          <ViewRow label="Living situation" value={meta.living_situation || null} />
          <ViewRow label="Schedule preference" value={meta.schedule_preference || null} />
          <ViewRow label="Care location" value={meta.care_location || null} />
          <ViewRow
            label="Language preference"
            value={
              Array.isArray(meta.language_preference)
                ? meta.language_preference.join(", ")
                : meta.language_preference || null
            }
          />
          <ViewRow
            label="About the care situation"
            value={
              meta.about_situation
                ? meta.about_situation.length > 80
                  ? meta.about_situation.slice(0, 80) + "..."
                  : meta.about_situation
                : null
            }
          />
        </div>
      </SectionCard>

    </div>
    </div>
      }
      right={
        editStep !== null ? (
          <ProfileEditContent
            key={editStep}
            profile={profile}
            userEmail={userEmail}
            onSaved={handleSaved}
            onClose={() => setEditStep(null)}
            initialStep={editStep}
          />
        ) : null
      }
    />
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
  const editLabel = status === "empty" ? "Add \u2192" : "Edit";

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      className="rounded-xl bg-white border border-gray-100 p-6 cursor-pointer hover:border-gray-200 transition-all duration-200"
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        <SectionBadge status={status} />
        <span className="ml-auto text-[14px] font-medium text-primary-600">
          {editLabel}
        </span>
      </div>

      {/* Content — stop click propagation so internal links/buttons work */}
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </section>
  );
}

function ViewRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="py-3.5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      {value ? (
        <p className="text-[15px] text-gray-900 mt-1">{value}</p>
      ) : (
        <p className="text-[15px] text-gray-300 mt-1">&mdash;</p>
      )}
    </div>
  );
}
