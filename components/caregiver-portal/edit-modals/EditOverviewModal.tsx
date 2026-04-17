"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

export default function EditOverviewModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;

  // Track mounted state
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [university, setUniversity] = useState(meta.university || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [photoUrl, setPhotoUrl] = useState(profile.image_url || "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track changes
  const hasChanges =
    displayName !== (profile.display_name || "") ||
    university !== (meta.university || "") ||
    city !== (profile.city || "") ||
    state !== (profile.state || "") ||
    photoUrl !== (profile.image_url || "");

  const isValid = displayName.trim().length > 0;

  async function handlePhotoUpload(file: File) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profile.id);

      const res = await fetch("/api/medjobs/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload photo");
        return;
      }

      // Update local state with new photo URL
      setPhotoUrl(data.imageUrl);
    } catch {
      setError("Network error uploading photo");
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
      }
    }
  }

  // Drag handlers
  const handleDrag = (e: React.DragEvent, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }

    // Validate required fields
    if (!displayName.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        topLevelFields: {
          display_name: displayName.trim(),
          city: city.trim() || null,
          state: state.trim().toUpperCase() || null,
        },
        metadataFields: {
          university: university.trim() || null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (guidedMode && onGuidedBack) {
      onGuidedBack();
    } else {
      onClose();
    }
  }

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const getButtonText = () => {
    return saving ? "Saving..." : guidedMode ? "Save & Next" : "Save";
  };

  const getBackButtonText = () => {
    return guidedMode && onGuidedBack ? "Back" : "Cancel";
  };

  // Footer component
  const footerContent = (
    <div className="pt-4 border-t border-gray-100">
      {/* Guided mode progress bar */}
      {guidedMode && guidedStep && guidedTotal && (
        <div className="flex gap-0.5 px-1 mb-4">
          {Array.from({ length: guidedTotal }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${
                i + 1 <= guidedStep ? "bg-primary-600" : "bg-gray-100"
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={saving || uploading}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          {getBackButtonText()}
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          {guidedMode && guidedStep && guidedTotal && (
            <span>Step {guidedStep} of {guidedTotal}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading || !isValid}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isValid
              ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title=""
      size="2xl"
      footer={footerContent}
    >
      <div className="px-2">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Your profile basics
          </h3>
          <p className="text-gray-500 text-sm">
            This is what providers see first
          </p>
        </div>

        {/* Photo Upload - Centered */}
        <div className="flex flex-col items-center mb-8">
          <div
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => handleDrag(e, true)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer group transition-all ${
              dragActive ? "scale-105" : ""
            }`}
          >
            {photoUrl ? (
              <div className="relative">
                <Image
                  src={photoUrl}
                  alt="Profile"
                  width={120}
                  height={120}
                  className={`w-28 h-28 rounded-2xl object-cover ring-4 transition-all ${
                    dragActive
                      ? "ring-primary-300"
                      : "ring-gray-100 group-hover:ring-primary-100"
                  }`}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-2xl transition-all flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Change
                  </span>
                </div>
              </div>
            ) : (
              <div className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center transition-all ${
                dragActive
                  ? "bg-primary-100 border-2 border-primary-400"
                  : "bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-dashed border-primary-200 group-hover:border-primary-400"
              }`}>
                {displayName ? (
                  <span className="text-2xl font-bold text-primary-600">{initials}</span>
                ) : (
                  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                <span className="text-xs text-primary-600 mt-1 font-medium">Add photo</span>
              </div>
            )}

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            {dragActive ? "Drop to upload" : "Click or drag to upload • JPG, PNG up to 5MB"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
          />
        </div>

        {/* Form Fields */}
        <div className="max-w-md mx-auto space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University
            </label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g., University of Texas at Austin"
              className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="col-span-2 bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value.slice(0, 2))}
                placeholder="TX"
                maxLength={2}
                className="bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all uppercase text-center"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Helps providers find you in their area
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-auto max-w-md mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
