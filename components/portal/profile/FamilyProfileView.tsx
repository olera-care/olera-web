"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
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
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- Photo upload ---
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image must be under 5MB.");
      return;
    }

    setImageUploading(true);
    try {
      if (!isSupabaseConfigured()) {
        setImageError("Storage is not configured.");
        return;
      }
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${profile.id}-${Date.now()}.${ext}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        if (
          uploadError.message?.includes("not found") ||
          uploadError.message?.includes("Bucket")
        ) {
          setImageError(
            "Image storage is not configured yet. Please contact your developer."
          );
        } else {
          setImageError(`Upload failed: ${uploadError.message}`);
        }
        return;
      }

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      await supabase
        .from("business_profiles")
        .update({ image_url: urlData.publicUrl })
        .eq("id", profile.id);

      await refreshAccountData();
    } catch {
      setImageError("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      left={
        <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
      {/* ── Profile Header ── */}
      <section className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={imageUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-primary-300 transition-colors cursor-pointer flex items-center justify-center group relative"
            >
              {profile.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-primary-500 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium">Add photo</span>
                </div>
              )}
              {imageUploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          </div>

          {/* Name + location */}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {profile.display_name || "Your Name"}
            </h2>
            <p className="text-base text-gray-500 mt-0.5">
              {location || "Location not set"}
              <span className="mx-1.5 text-gray-300">&middot;</span>
              Family care seeker
            </p>
          </div>

          {/* Edit basic info */}
          <button
            type="button"
            onClick={() => openEdit(0)}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="Edit basic info"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Completeness row — hidden at 100% */}
        {percentage < 100 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[5px] bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 80 ? "bg-primary-600" : "bg-amber-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className={`text-[13px] font-semibold shrink-0 ${
                percentage >= 80 ? "text-primary-700" : "text-amber-700"
              }`}>
                {percentage}% complete
              </span>
            </div>
          </div>
        )}

        {imageError && (
          <p className="text-sm text-red-600 px-6 pb-4">{imageError}</p>
        )}
      </section>

      {/* ── Contact Information ── */}
      <SectionCard
        title="Contact Information"
        subtitle="How providers can reach you. This is shared when you connect."
        status={sectionStatus[1]}
        onEdit={() => openEdit(1)}
      >
        <div className="divide-y divide-gray-100">
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
        subtitle="Auto-filled from your connection request. Shared with every provider you connect with."
        status={sectionStatus[2]}
        onEdit={() => openEdit(2)}
      >
        <div className="divide-y divide-gray-100">
          <ViewRow label="Who needs care" value={meta.relationship_to_recipient || null} />
          <ViewRow label="Type of care" value={careTypesDisplay} />
          <ViewRow label="Timeline" value={timelineDisplay} />
          <ViewRow label="Additional notes" value={profile.description || null} />
        </div>
      </SectionCard>

      {/* ── Payment & Benefits ── */}
      <SectionCard
        title="Payment & Benefits"
        subtitle="How are you planning to pay for care?"
        status={sectionStatus[3]}
        onEdit={() => openEdit(3)}
      >
        {meta.payment_methods && meta.payment_methods.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {meta.payment_methods.map((method) => (
              <span
                key={method}
                className="px-3.5 py-2 text-[15px] font-medium rounded-full bg-primary-50 text-primary-700 border border-primary-100"
              >
                {method}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-amber-600 italic mb-4">Not provided</p>
        )}
        <BenefitsFinderBanner />
      </SectionCard>

      {/* ── More About Your Situation ── */}
      <SectionCard
        title="More About Your Situation"
        subtitle="Help providers understand your needs better."
        status={combineSectionStatus()}
        onEdit={() => openEdit(4)}
      >
        <div className="divide-y divide-gray-100">
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
      emptyState={
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Select a section to edit</p>
          <p className="text-xs text-gray-500 mt-1">Click any section on the left to update your profile</p>
        </div>
      }
    />
  );
}

// ── Helper Components ──

function SectionBadge({ status }: { status: SectionStatus | undefined }) {
  if (!status || status === "complete") {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
        <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  const label = status === "empty" ? "Not added" : "Incomplete";
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      {label}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  status,
  onEdit,
  children,
}: {
  title: string;
  subtitle: string;
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
      className="rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-gray-200 hover:bg-gray-50/50 transition-colors"
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-0.5">
        <h3 className="text-[17px] font-bold text-gray-900">{title}</h3>
        <SectionBadge status={status} />
        <span className="ml-auto text-[14px] font-semibold text-primary-600">
          {editLabel}
        </span>
      </div>
      <p className="text-[13px] text-gray-500 mb-5">{subtitle}</p>

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
    <div className="py-3">
      <p className="text-[13px] text-gray-500">{label}</p>
      {value ? (
        <p className="text-[15px] text-gray-900 mt-0.5">{value}</p>
      ) : (
        <p className="text-[15px] text-amber-600 italic mt-0.5">Not provided</p>
      )}
    </div>
  );
}
