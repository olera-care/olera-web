"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { useProfileCompleteness } from "./completeness";
import ProfileEditDrawer, { BenefitsFinderBanner } from "./ProfileEditDrawer";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = activeProfile as BusinessProfile;
  const meta = (profile?.metadata || {}) as FamilyMetadata;
  const userEmail = user?.email || "";

  const { percentage, firstIncompleteStep } = useProfileCompleteness(
    profile,
    userEmail
  );

  if (!profile) return null;

  const openDrawer = (step: number) => {
    setDrawerStep(step);
    setDrawerOpen(true);
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

  return (
    <div className="space-y-6">
      {/* ── Profile Header ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-5">
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
            onClick={() => openDrawer(0)}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="Edit basic info"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        {imageError && (
          <p className="text-sm text-red-600 mt-3">{imageError}</p>
        )}
      </section>

      {/* ── Completeness Banner ── */}
      {percentage < 100 && (
        <section className="bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl border border-primary-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">
              Profile completeness
            </h3>
            <span className="text-base font-bold text-primary-700">
              {percentage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            Keep your information up to date so providers can understand your
            needs. Add a photo and payment details to help providers respond
            faster.
          </p>
          <button
            type="button"
            onClick={() => openDrawer(firstIncompleteStep)}
            className="text-base font-semibold text-primary-700 hover:text-primary-800 transition-colors"
          >
            Complete your profile &rarr;
          </button>
        </section>
      )}

      {/* ── Contact Information ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900">
            Contact Information
          </h3>
          <EditButton onClick={() => openDrawer(1)} />
        </div>
        <p className="text-sm text-gray-500 mb-5">
          How providers can reach you. This is shared when you connect.
        </p>

        <div className="space-y-4">
          <ViewRow
            label="Email"
            value={profile.email || userEmail || null}
            onAction={() => openDrawer(1)}
          />
          <ViewRow
            label="Phone"
            value={profile.phone}
            emptyText="Not added yet"
            onAction={() => openDrawer(1)}
            actionLabel={profile.phone ? "Edit" : "+ Add"}
          />
          <ViewRow
            label="Preferred contact method"
            value={
              meta.contact_preference
                ? CONTACT_PREF_LABELS[meta.contact_preference] ||
                  meta.contact_preference
                : null
            }
            emptyText="Not set yet"
            onAction={() => openDrawer(1)}
            actionLabel={meta.contact_preference ? "Edit" : "+ Add"}
          />
        </div>
      </section>

      {/* ── Care Preferences ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900">
            Care Preferences
          </h3>
          <EditButton onClick={() => openDrawer(2)} />
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Auto-filled from your connection request. Shared with every provider
          you connect with.
        </p>

        <div className="space-y-4">
          <ViewRow
            label="Who needs care"
            value={meta.relationship_to_recipient || null}
            onAction={() => openDrawer(2)}
          />
          <ViewRow
            label="Type of care"
            value={careTypesDisplay}
            onAction={() => openDrawer(2)}
          />
          <ViewRow
            label="Timeline"
            value={timelineDisplay}
            onAction={() => openDrawer(2)}
          />
          <ViewRow
            label="Additional notes"
            value={profile.description || null}
            emptyText="None"
            onAction={() => openDrawer(2)}
          />
        </div>
      </section>

      {/* ── Payment & Benefits ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900">
            Payment & Benefits
          </h3>
          <EditButton onClick={() => openDrawer(3)} />
        </div>
        <p className="text-sm text-gray-500 mb-5">
          How are you planning to pay for care? Select all that apply.
        </p>

        {meta.payment_methods && meta.payment_methods.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {meta.payment_methods.map((method) => (
              <span
                key={method}
                className="px-3.5 py-2 text-base font-medium rounded-full bg-primary-50 text-primary-700 border border-primary-100"
              >
                {method}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-base text-gray-400 italic mb-4">
            No payment methods selected
          </p>
        )}

        <BenefitsFinderBanner />
      </section>

      {/* ── More About Your Situation (Enrichment) ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          More About Your Situation
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Help providers understand your needs better.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EnrichmentCard
            icon={
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            }
            label="Living situation"
            prompt="Where does the person who needs care live?"
            value={meta.living_situation || null}
            onClick={() => openDrawer(4)}
          />
          <EnrichmentCard
            icon={
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            label="Schedule preference"
            prompt="What times of day do you need care?"
            value={meta.schedule_preference || null}
            onClick={() => openDrawer(5)}
          />
          <EnrichmentCard
            icon={
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
            label="Care location"
            prompt="What area is care needed in?"
            value={meta.care_location || null}
            onClick={() => openDrawer(5)}
          />
          <EnrichmentCard
            icon={
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
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            }
            label="Language preference"
            prompt="Any language needs for the caregiver?"
            value={
              Array.isArray(meta.language_preference)
                ? meta.language_preference.join(", ")
                : meta.language_preference || null
            }
            onClick={() => openDrawer(6)}
          />
          <EnrichmentCard
            icon={
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            label="About the care situation"
            prompt="Tell providers more about daily life"
            value={
              meta.about_situation
                ? meta.about_situation.length > 60
                  ? meta.about_situation.slice(0, 60) + "..."
                  : meta.about_situation
                : null
            }
            onClick={() => openDrawer(6)}
            fullWidth
          />
        </div>
      </section>

      {/* ── Edit Drawer ── */}
      <ProfileEditDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialStep={drawerStep}
        profile={profile}
        userEmail={userEmail}
        onSaved={handleSaved}
      />
    </div>
  );
}

// ── Helper Components ──

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
    >
      Edit
    </button>
  );
}

function ViewRow({
  label,
  value,
  emptyText = "Not set",
  onAction,
  actionLabel = "Edit",
}: {
  label: string;
  value: string | null;
  emptyText?: string;
  onAction: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {value ? (
          <p className="text-base text-gray-900 mt-0.5">{value}</p>
        ) : (
          <p className="text-base text-gray-400 italic mt-0.5">{emptyText}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onAction}
        className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors shrink-0 ml-4"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function EnrichmentCard({
  icon,
  label,
  prompt,
  value,
  onClick,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  value: string | null;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all duration-150 group ${
        value
          ? "border-primary-100 bg-primary-50/30 hover:bg-primary-50/60"
          : "border-gray-200 bg-gray-50/50 hover:border-primary-200 hover:bg-primary-50/20"
      } ${fullWidth ? "sm:col-span-2" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 mt-0.5 ${
            value ? "text-primary-600" : "text-gray-400 group-hover:text-primary-500"
          } transition-colors`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-800">{label}</p>
          {value ? (
            <p className="text-sm text-primary-700 mt-0.5 font-medium">
              {value}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">{prompt}</p>
          )}
        </div>
      </div>
    </button>
  );
}
