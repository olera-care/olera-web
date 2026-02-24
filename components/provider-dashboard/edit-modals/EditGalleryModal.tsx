"use client";

import { useState, useRef, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadingFile {
  id: string;
  name: string;
  preview: string;
}

export default function EditGalleryModal({
  profile,
  metadata,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const [images, setImages] = useState<string[]>(metadata.images || []);
  const [newUrl, setNewUrl] = useState("");
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges =
    JSON.stringify(images) !== JSON.stringify(metadata.images || []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Client-side validation
      for (const file of fileArray) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`"${file.name}" is not a supported format. Use JPEG, PNG, or WebP.`);
          return;
        }
        if (file.size > MAX_SIZE) {
          setError(`"${file.name}" exceeds the 5MB limit.`);
          return;
        }
      }

      // Create preview placeholders
      const newUploading: UploadingFile[] = fileArray.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        preview: URL.createObjectURL(file),
      }));
      setUploading((prev) => [...prev, ...newUploading]);

      // Upload each file
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const uploadEntry = newUploading[i];
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("profileId", profile.id);

          const res = await fetch("/api/profile/upload-image", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            setError(data.error || `Failed to upload "${file.name}".`);
            setUploading((prev) => prev.filter((u) => u.id !== uploadEntry.id));
            continue;
          }

          const { imageUrl } = await res.json();
          setImages((prev) => [...prev, imageUrl]);
          setUploading((prev) => prev.filter((u) => u.id !== uploadEntry.id));
        } catch {
          setError(`Failed to upload "${file.name}". Please try again.`);
          setUploading((prev) => prev.filter((u) => u.id !== uploadEntry.id));
        } finally {
          URL.revokeObjectURL(uploadEntry.preview);
        }
      }
    },
    [profile.id]
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
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
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      uploadFiles(e.target.files);
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  function addImageUrl() {
    const trimmed = newUrl.trim();
    if (trimmed && !images.includes(trimmed)) {
      setImages((prev) => [...prev, trimmed]);
    }
    setNewUrl("");
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        profileId: profile.id,
        metadataFields: { images },
        existingMetadata: (profile.metadata || {}) as Record<string, unknown>,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const isUploading = uploading.length > 0;

  return (
    <Modal isOpen onClose={onClose} title="Edit Gallery" size="lg">
      <div className="space-y-5 pt-2">
        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer group ${
            isDragOver
              ? "border-primary-400 bg-primary-50/60"
              : "border-warm-200 bg-vanilla-50/50 hover:border-primary-300 hover:bg-primary-50/30"
          }`}
        >
          <div className="flex flex-col items-center py-8 px-4 text-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors duration-200 ${
                isDragOver
                  ? "bg-primary-100 text-primary-600"
                  : "bg-warm-100 text-warm-400 group-hover:bg-primary-100 group-hover:text-primary-500"
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-gray-900">
              {isDragOver ? "Drop photos here" : "Upload photos"}
            </p>
            <p className="text-sm text-warm-500 mt-1">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-warm-400 mt-2">
              JPEG, PNG, or WebP &middot; Max 5MB each
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload gallery photos"
          />
        </div>

        {/* Current images grid + uploading placeholders */}
        {(images.length > 0 || uploading.length > 0) && (
          <div className="grid grid-cols-3 gap-3">
            {images.map((src, i) => (
              <div key={src} className="relative group rounded-xl overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Gallery photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {/* Uploading placeholders */}
            {uploading.map((u) => (
              <div key={u.id} className="relative rounded-xl overflow-hidden aspect-square bg-warm-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.preview}
                  alt={`Uploading ${u.name}`}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* URL fallback */}
        <div>
          <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">
            Or add image URL
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Image URL"
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl((e.target as HTMLInputElement).value)}
                placeholder="https://example.com/photo.jpg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={addImageUrl}
              disabled={!newUrl.trim()}
              className="self-end px-4 py-3 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>

      <ModalFooter
        saving={saving || isUploading}
        hasChanges={hasChanges}
        onClose={onClose}
        onSave={handleSave}
        guidedMode={guidedMode}
        guidedStep={guidedStep}
        guidedTotal={guidedTotal}
        onGuidedBack={onGuidedBack}
      />
    </Modal>
  );
}
