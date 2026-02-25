"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { saveProfile } from "@/components/provider-dashboard/edit-modals/save-profile";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ID_TYPES = [
  "National ID",
  "Passport",
  "Driver's License",
  "Voter ID",
  "Residence Permit",
];

const ROLES = [
  "Owner",
  "Manager",
  "Administrator",
  "Director",
  "Staff",
];

type SectionKey = "id" | "photo" | "role" | "affiliation";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ChevronIcon({ className = "w-4 h-4", open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function ClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Upload Area
// ---------------------------------------------------------------------------

function UploadArea({
  existingUrl,
  uploading,
  onFileSelected,
  onRemove,
  disabled,
}: {
  existingUrl: string;
  uploading: boolean;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files?.[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      onFileSelected(e.target.files[0]);
    }
    e.target.value = "";
  }

  // Show preview if we have a URL
  if (existingUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-warm-50 border border-warm-100">
        <div className="flex items-center gap-4 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={existingUrl}
            alt="Uploaded"
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Image uploaded</p>
            <p className="text-xs text-gray-500 mt-0.5">JPEG, PNG, or WebP</p>
          </div>
          {!disabled && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Upload spinner state
  if (uploading) {
    return (
      <div className="rounded-xl border-2 border-dashed border-warm-200 bg-vanilla-50/50 py-8 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-2" />
        <p className="text-sm text-gray-500">Uploading...</p>
      </div>
    );
  }

  // Drop zone
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed transition-all duration-200 ${
        disabled
          ? "border-warm-100 bg-warm-50/50 opacity-60 cursor-not-allowed"
          : isDragOver
            ? "border-primary-400 bg-primary-50/60 cursor-pointer"
            : "border-warm-200 bg-vanilla-50/50 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer"
      }`}
    >
      <div className="flex flex-col items-center py-6 px-4 text-center">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
            isDragOver
              ? "bg-primary-100 text-primary-600"
              : "bg-warm-100 text-warm-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">
          {isDragOver ? "Drop here" : "Click to upload or drag and drop"}
        </p>
        <p className="text-xs text-warm-400 mt-1">
          JPEG, PNG, or WebP &middot; Max 5MB
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload image"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function VerificationSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-3xl animate-pulse">
        <div className="h-7 w-48 bg-warm-100 rounded mb-2" />
        <div className="h-4 w-72 bg-warm-50 rounded mb-8" />
        <div className="bg-white rounded-2xl border border-warm-100/60 divide-y divide-warm-100/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-5 flex items-center gap-4">
              <div className="w-9 h-9 bg-warm-50 rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-warm-100 rounded mb-1.5" />
                <div className="h-3 w-56 bg-warm-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Icons (small, for each row)
// ---------------------------------------------------------------------------

function IdCardIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
    </svg>
  );
}

function CameraIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  );
}

function BriefcaseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function BuildingIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProviderVerificationPage() {
  const profile = useProviderProfile();
  const { refreshAccountData } = useAuth();

  // Local state
  const [idType, setIdType] = useState("");
  const [idImageUrl, setIdImageUrl] = useState("");
  const [managerPhotoUrl, setManagerPhotoUrl] = useState("");
  const [role, setRole] = useState("");
  const [affiliationImageUrl, setAffiliationImageUrl] = useState("");

  // Upload loading states
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAffiliation, setUploadingAffiliation] = useState(false);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);

  // Hydrate from metadata once profile loads
  useEffect(() => {
    if (!profile) return;
    const meta = (profile.metadata || {}) as Record<string, unknown>;
    setIdType((meta.verification_id_type as string) || "");
    setIdImageUrl((meta.verification_id_image as string) || "");
    setManagerPhotoUrl((meta.verification_manager_photo as string) || "");
    setRole((meta.verification_role as string) || "");
    setAffiliationImageUrl((meta.verification_affiliation_image as string) || "");
  }, [profile]);

  // Derived completeness
  const sectionComplete: Record<SectionKey, boolean> = {
    id: !!idType && !!idImageUrl,
    photo: !!managerPhotoUrl,
    role: !!role,
    affiliation: !!affiliationImageUrl,
  };

  const allComplete = Object.values(sectionComplete).every(Boolean);
  const isReadOnly = profile?.verification_state === "pending" || profile?.verification_state === "verified";
  const canSubmit = allComplete && profile?.verification_state === "unverified" && !submitting;

  // Upload handler
  const uploadFile = useCallback(
    async (
      file: File,
      setUrl: (url: string) => void,
      setUploading: (v: boolean) => void,
    ) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Please upload a JPEG, PNG, or WebP image.");
        return;
      }
      if (file.size > MAX_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setError(`This image is ${sizeMB}MB \u2014 the maximum is 5MB.`);
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("profileId", profile!.id);

        const res = await fetch("/api/profile/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Upload failed. Please try again.");
          return;
        }

        const { imageUrl } = await res.json();
        setUrl(imageUrl);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [profile],
  );

  // Submit handler
  async function handleSubmit() {
    if (!canSubmit || !profile) return;
    setSubmitting(true);
    setError(null);

    try {
      await saveProfile({
        profileId: profile.id,
        topLevelFields: {
          verification_state: "pending",
        },
        metadataFields: {
          verification_id_type: idType,
          verification_id_image: idImageUrl,
          verification_manager_photo: managerPhotoUrl,
          verification_role: role,
          verification_affiliation_image: affiliationImageUrl,
        },
        existingMetadata: (profile.metadata || {}) as Record<string, unknown>,
      });

      await refreshAccountData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSection(key: SectionKey) {
    if (isReadOnly) return;
    setExpandedSection((prev) => (prev === key ? null : key));
  }

  if (!profile) return <VerificationSkeleton />;

  // Section config
  const sections: {
    key: SectionKey;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    completeSummary: string;
  }[] = [
    {
      key: "id",
      icon: <IdCardIcon className="w-5 h-5" />,
      title: "ID Verification",
      subtitle: "Select your ID type and upload an image of it.",
      completeSummary: idType ? `${idType} \u2014 uploaded` : "",
    },
    {
      key: "photo",
      icon: <CameraIcon className="w-5 h-5" />,
      title: "Your Photo",
      subtitle: "Upload a clear photo of yourself.",
      completeSummary: "Photo uploaded",
    },
    {
      key: "role",
      icon: <BriefcaseIcon className="w-5 h-5" />,
      title: "Your Role",
      subtitle: "What is your role at this business?",
      completeSummary: role || "",
    },
    {
      key: "affiliation",
      icon: <BuildingIcon className="w-5 h-5" />,
      title: "Business Affiliation",
      subtitle: "Upload a photo showing your connection to the business.",
      completeSummary: "Photo uploaded",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Identity Verification
          </h1>
          <p className="text-[15px] text-gray-500 mt-1">
            Complete these steps to verify your account. It only takes a minute.
          </p>
        </div>

        {/* Status banners */}
        {profile.verification_state === "verified" && (
          <div className="bg-success-50 border border-success-100 rounded-2xl p-5 flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-display font-semibold text-success-700">
                Verified
              </h2>
              <p className="text-sm text-success-600 mt-0.5">
                Your identity has been verified. Families can see your verification badge.
              </p>
            </div>
          </div>
        )}

        {profile.verification_state === "pending" && (
          <div className="bg-warning-50 border border-warning-100 rounded-2xl p-5 flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center shrink-0">
              <ClockIcon className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-display font-semibold text-warning-700">
                Under Review
              </h2>
              <p className="text-sm text-warning-600 mt-0.5">
                Your verification is being reviewed. We&apos;ll notify you once it&apos;s approved.
              </p>
            </div>
          </div>
        )}

        {/* Main accordion card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm divide-y divide-warm-100/60 mb-6">
          {sections.map((section) => {
            const isComplete = sectionComplete[section.key];
            const isExpanded = expandedSection === section.key;

            return (
              <div key={section.key}>
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  disabled={isReadOnly}
                  className={`w-full px-6 py-5 flex items-center gap-4 text-left transition-colors ${
                    isReadOnly ? "cursor-default" : "hover:bg-vanilla-50/50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isComplete
                        ? "bg-success-50 text-success-600"
                        : "bg-warm-50 text-warm-400"
                    }`}
                  >
                    {isComplete ? <CheckIcon className="w-4 h-4" /> : section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-display font-semibold text-gray-900">
                      {section.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {isComplete && !isExpanded ? section.completeSummary : section.subtitle}
                    </p>
                  </div>
                  {!isReadOnly && (
                    <div className="shrink-0">
                      {isComplete && !isExpanded ? (
                        <span className="text-xs font-medium text-primary-600">Edit</span>
                      ) : (
                        <ChevronIcon className="w-4 h-4 text-gray-400" open={isExpanded} />
                      )}
                    </div>
                  )}
                  {isReadOnly && isComplete && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700 shrink-0">
                      <CheckIcon className="w-3 h-3" />
                      Done
                    </span>
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && !isReadOnly && (
                  <div className="px-6 pb-5 pt-0">
                    {section.key === "id" && (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="id-type"
                            className="block text-sm font-medium text-gray-700 mb-1.5"
                          >
                            ID Type
                          </label>
                          <select
                            id="id-type"
                            value={idType}
                            onChange={(e) => setIdType(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base bg-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px] appearance-none"
                          >
                            <option value="">Select ID type</option>
                            {ID_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            ID Image
                          </label>
                          <UploadArea
                            existingUrl={idImageUrl}
                            uploading={uploadingId}
                            onFileSelected={(file) =>
                              uploadFile(file, setIdImageUrl, setUploadingId)
                            }
                            onRemove={() => setIdImageUrl("")}
                          />
                        </div>
                      </div>
                    )}

                    {section.key === "photo" && (
                      <UploadArea
                        existingUrl={managerPhotoUrl}
                        uploading={uploadingPhoto}
                        onFileSelected={(file) =>
                          uploadFile(file, setManagerPhotoUrl, setUploadingPhoto)
                        }
                        onRemove={() => setManagerPhotoUrl("")}
                      />
                    )}

                    {section.key === "role" && (
                      <div>
                        <label
                          htmlFor="role-select"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Select your role
                        </label>
                        <select
                          id="role-select"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base bg-white focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary-500 min-h-[44px] appearance-none"
                        >
                          <option value="">Select role</option>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {section.key === "affiliation" && (
                      <div>
                        <p className="text-sm text-gray-500 mb-3">
                          This could be a photo of the facility, your company badge, uniform, or anything that shows your connection.
                        </p>
                        <UploadArea
                          existingUrl={affiliationImageUrl}
                          uploading={uploadingAffiliation}
                          onFileSelected={(file) =>
                            uploadFile(file, setAffiliationImageUrl, setUploadingAffiliation)
                          }
                          onRemove={() => setAffiliationImageUrl("")}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 mb-6" role="alert">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-500 transition-colors shrink-0"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Submit button */}
        {!isReadOnly && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit for Verification"
            )}
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
