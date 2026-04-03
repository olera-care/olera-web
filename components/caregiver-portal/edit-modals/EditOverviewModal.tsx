"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
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

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [university, setUniversity] = useState(meta.university || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [photoUrl, setPhotoUrl] = useState(profile.image_url || "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track changes
  const hasChanges =
    displayName !== (profile.display_name || "") ||
    university !== (meta.university || "") ||
    city !== (profile.city || "") ||
    state !== (profile.state || "") ||
    photoUrl !== (profile.image_url || "");

  async function handlePhotoUpload(file: File) {
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
      setUploading(false);
    }
  }

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
          state: state.trim() || null,
        },
        metadataFields: {
          university: university.trim() || null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Profile Overview"
      size="lg"
      footer={
        <ModalFooter
          saving={saving || uploading}
          hasChanges={hasChanges}
          onClose={onClose}
          onSave={handleSave}
          guidedMode={guidedMode}
          guidedStep={guidedStep}
          guidedTotal={guidedTotal}
          onGuidedBack={onGuidedBack}
        />
      }
    >
      <div className="space-y-6 pt-4">
        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center border border-primary-100">
                  <span className="text-xl font-bold text-primary-700">{initials}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                {photoUrl ? "Change photo" : "Upload photo"}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all"
          />
        </div>

        {/* University */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">University</label>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="e.g., University of Texas at Austin"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all"
            />
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State (e.g., TX)"
              maxLength={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all uppercase"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">This helps providers find you in their area</p>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
      </div>
    </Modal>
  );
}
