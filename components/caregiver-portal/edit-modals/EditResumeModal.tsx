"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

interface UploadedFile {
  name: string;
  size: number;
}

export default function EditResumeModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const [linkedinUrl, setLinkedinUrl] = useState(meta.linkedin_url || "");
  const [resumeUrl, setResumeUrl] = useState(meta.resume_url || "");
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [resumeJustSaved, setResumeJustSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewingResume, setViewingResume] = useState(false);

  // Track changes to either field
  const hasChanges =
    linkedinUrl !== (meta.linkedin_url || "") ||
    resumeUrl !== (meta.resume_url || "");

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Normalize LinkedIn URL - add https:// if missing
  const normalizeLinkedInUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return "";

    // If no protocol, prepend https://
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  // Validate LinkedIn URL (after normalization)
  const isValidLinkedIn = (url: string) => {
    if (!url.trim()) return true; // Empty is valid (optional field)
    const normalized = normalizeLinkedInUrl(url);
    // Allow word chars, hyphens, and periods in username (e.g., john.doe, jane-smith.phd)
    const pattern = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[\w.-]+/i;
    return pattern.test(normalized);
  };

  async function handleDeleteResume() {
    setDeleting(true);
    setError(null);
    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: { resume_url: null },
      });
      if (isMountedRef.current) {
        setResumeUrl("");
        setResumeFile(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to delete resume");
      }
    } finally {
      if (isMountedRef.current) setDeleting(false);
    }
  }

  async function handleSave() {
    // Allow close if no changes at all
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }

    // Validate LinkedIn URL if provided
    if (linkedinUrl.trim() && !isValidLinkedIn(linkedinUrl)) {
      setError("Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Normalize LinkedIn URL before saving
      const normalizedLinkedIn = linkedinUrl.trim() ? normalizeLinkedInUrl(linkedinUrl) : null;

      // Save both fields together to prevent race conditions
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          linkedin_url: normalizedLinkedIn,
          resume_url: resumeUrl || null,
        },
      });
      onSaved();
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profile.id);
      formData.append("documentType", "resume");

      const res = await fetch("/api/medjobs/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }

      if (data.filePath) {
        if (isMountedRef.current) setUploadSuccess(true);

        await saveStudentProfile({
          profileId: profile.id,
          metadataFields: { resume_url: data.filePath },
        });

        setTimeout(() => {
          if (!isMountedRef.current) return;
          setUploadSuccess(false);
          setResumeUrl(data.filePath);
          setResumeFile({ name: file.name, size: file.size });
          setResumeJustSaved(true);
          setTimeout(() => {
            if (isMountedRef.current) setResumeJustSaved(false);
          }, 3000);
        }, 800);
      }
    } catch {
      if (isMountedRef.current) setError("Network error. Please try again.");
    } finally {
      if (isMountedRef.current) setUploading(false);
    }
  }, [profile.id]);

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  // Open resume in new tab via signed URL
  const handleViewResume = async () => {
    if (!resumeUrl || viewingResume) return;

    setViewingResume(true);
    try {
      const res = await fetch("/api/medjobs/get-document-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: resumeUrl, studentProfileId: profile.id }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      }
    } catch {
      // Silently fail
    } finally {
      if (isMountedRef.current) setViewingResume(false);
    }
  };

  // Extract filename from resume URL path
  const getResumeFilename = () => {
    if (!resumeUrl) return null;
    const parts = resumeUrl.split("/");
    const filename = parts[parts.length - 1];
    // Remove UUID prefix if present (format: uuid_filename.pdf)
    const match = filename.match(/^[a-f0-9-]+_(.+)$/i);
    return match ? match[1] : filename;
  };

  const resumeFilename = resumeFile?.name || getResumeFilename();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Resume & LinkedIn"
      size="md"
      footer={
        <ModalFooter
          saving={saving || uploading || deleting}
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
      <div className="space-y-5 py-2">
        {/* Resume Upload - streamlined */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume <span className="text-gray-400 font-normal">(PDF)</span>
          </label>

          {resumeUrl ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {/* PDF icon */}
              <div className="w-10 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <text x="7" y="17" fontSize="6" fontWeight="bold" fill="currentColor">PDF</text>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {resumeFilename || "Resume.pdf"}
                  </p>
                  {resumeJustSaved && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-medium rounded-full animate-pulse">
                      Saved
                    </span>
                  )}
                </div>
                {resumeFile ? (
                  <p className="text-xs text-gray-500">{formatFileSize(resumeFile.size)}</p>
                ) : (
                  <p className="text-xs text-gray-500">PDF Document</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleViewResume}
                  disabled={viewingResume || uploading || deleting}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  {viewingResume ? "..." : "View"}
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading || deleting}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleDeleteResume}
                  disabled={uploading || deleting}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting ? "..." : "Remove"}
                </button>
              </div>
            </div>
          ) : (
            /* Compact drop zone */
            <div
              onDragEnter={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDragOver={(e) => handleDrag(e, true)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative flex items-center justify-center gap-3 py-6 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                dragActive
                  ? "border-primary-600 bg-primary-50"
                  : uploading
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
              }`}
            >
              {uploading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                  <span className="text-sm font-medium text-primary-600">Uploading...</span>
                </div>
              ) : uploadSuccess ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-primary-600">Uploaded!</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {dragActive ? "Drop here" : "Click or drag to upload PDF"}
                  </span>
                </>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
        </div>

        {/* LinkedIn - streamlined */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="linkedin.com/in/yourname"
              className={`w-full bg-gray-50 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all outline-none ${
                linkedinUrl && !isValidLinkedIn(linkedinUrl)
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 focus:bg-white"
              }`}
            />
            {linkedinUrl && isValidLinkedIn(linkedinUrl) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {linkedinUrl && !isValidLinkedIn(linkedinUrl) && (
            <p className="text-xs text-red-500 mt-1.5">
              Enter a valid LinkedIn URL (e.g., linkedin.com/in/yourname)
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
