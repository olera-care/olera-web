"use client";

import { useState, useRef, useCallback } from "react";

interface ImageDropZoneProps {
  currentUrl: string | null;
  articleId: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  label?: string;
}

export default function ImageDropZone({
  currentUrl,
  articleId,
  onUpload,
  onRemove,
  label = "Cover Image",
}: ImageDropZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("articleId", articleId);

      try {
        const res = await fetch("/api/admin/content/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const { imageUrl } = await res.json();
          onUpload(imageUrl);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Upload failed");
        }
      } catch {
        setError("Network error");
      } finally {
        setUploading(false);
      }
    },
    [articleId, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      e.target.value = "";
    },
    [handleUpload]
  );

  if (currentUrl) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt="Preview"
            className="max-w-sm max-h-48 rounded-lg object-cover border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-sm"
            title="Remove image"
          >
            x
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={[
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          dragActive
            ? "border-primary-400 bg-primary-50"
            : "border-gray-300 hover:border-gray-400",
        ].join(" ")}
      >
        {uploading ? (
          <p className="text-sm text-gray-500">Uploading...</p>
        ) : (
          <>
            <svg
              className="w-8 h-8 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600 font-medium">
              Drag and drop an image, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, or WebP. Max 5MB.</p>
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
