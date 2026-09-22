"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

// File info type for upload preview
interface UploadedFile {
  name: string;
  type: string;
  size: number;
}

// Helper to extract YouTube video ID
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to extract Loom video ID
function getLoomId(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Helper to extract Vimeo video ID
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

// Get video platform info
function getVideoInfo(url: string): { platform: "youtube" | "loom" | "vimeo" | null; id: string | null } {
  if (!url.trim()) return { platform: null, id: null };

  const youtubeId = getYouTubeId(url);
  if (youtubeId) return { platform: "youtube", id: youtubeId };

  const loomId = getLoomId(url);
  if (loomId) return { platform: "loom", id: loomId };

  const vimeoId = getVimeoId(url);
  if (vimeoId) return { platform: "vimeo", id: vimeoId };

  return { platform: null, id: null };
}

// Check if URL looks like a video URL but isn't supported
function looksLikeVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  const videoPatterns = [
    /^https?:\/\//,
    /\.(mp4|mov|avi|webm|mkv)$/i,
    /video/i,
    /watch/i,
  ];
  return videoPatterns.some(p => p.test(url));
}

export default function EditVerificationModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Video state
  const [videoUrl, setVideoUrl] = useState(meta.video_intro_url || "");
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [videoSaved, setVideoSaved] = useState(!!meta.video_intro_url);
  const [isEditingUrl, setIsEditingUrl] = useState(false); // Only true when actively typing a new URL
  const [originalVideoUrl] = useState(meta.video_intro_url || ""); // Store original for cancel

  // Optional documents section - collapsed by default
  const [showDocuments, setShowDocuments] = useState(false);

  // Driver's license
  const [licenseUploaded, setLicenseUploaded] = useState(!!meta.drivers_license_url);
  const [licenseFile, setLicenseFile] = useState<UploadedFile | null>(null);
  const [licenseExpiration, setLicenseExpiration] = useState(meta.drivers_license_expiration || "");
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [licenseDeleting, setLicenseDeleting] = useState(false);

  // Car insurance
  const [insuranceUploaded, setInsuranceUploaded] = useState(!!meta.car_insurance_url);
  const [insuranceFile, setInsuranceFile] = useState<UploadedFile | null>(null);
  const [insuranceExpiration, setInsuranceExpiration] = useState(meta.car_insurance_expiration || "");
  const [insuranceUploading, setInsuranceUploading] = useState(false);
  const [insuranceDeleting, setInsuranceDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [licenseDragActive, setLicenseDragActive] = useState(false);
  const [insuranceDragActive, setInsuranceDragActive] = useState(false);

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  // Get video info for preview
  const videoInfo = getVideoInfo(videoUrl);
  const hasValidVideo = !!(videoInfo.platform && videoInfo.id);

  // Check if URL looks like a video but isn't supported
  const showInvalidUrlHint = !hasValidVideo && looksLikeVideoUrl(videoUrl) && videoUrl.trim().length > 10;

  // Submit video to API
  const submitVideo = useCallback(async (url: string) => {
    setVideoSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/medjobs/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: profile.slug, videoUrl: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (isMountedRef.current) {
          setError(data.error || "Failed to save video");
        }
        return false;
      }

      if (isMountedRef.current) {
        setVideoSaved(!!url.trim());
        setIsEditingUrl(false);
      }
      return true;
    } catch {
      if (isMountedRef.current) {
        setError("Network error. Please try again.");
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setVideoSubmitting(false);
      }
    }
  }, [profile.slug]);

  // Auto-save when valid URL is entered (on blur)
  const handleVideoBlur = useCallback(async () => {
    // Only auto-save if URL changed and is valid
    if (videoUrl.trim() !== originalVideoUrl && hasValidVideo) {
      await submitVideo(videoUrl);
    }
  }, [videoUrl, originalVideoUrl, hasValidVideo, submitVideo]);

  // Delete video (empty URL)
  const deleteVideo = useCallback(async () => {
    const success = await submitVideo("");
    if (success && isMountedRef.current) {
      setVideoUrl("");
      setVideoSaved(false);
      setIsEditingUrl(false);
    }
  }, [submitVideo]);

  // Cancel editing and revert to original URL
  const cancelEditUrl = useCallback(() => {
    setVideoUrl(originalVideoUrl);
    setIsEditingUrl(false);
    setError(null);
  }, [originalVideoUrl]);

  // Start editing the URL
  const startEditingUrl = useCallback(() => {
    setIsEditingUrl(true);
    setError(null);
  }, []);

  // Save the new URL explicitly
  const saveNewUrl = useCallback(async () => {
    if (!hasValidVideo) {
      setError("Please enter a valid YouTube, Loom, or Vimeo URL");
      return;
    }
    await submitVideo(videoUrl);
  }, [hasValidVideo, videoUrl, submitVideo]);

  const handleDocumentUpload = useCallback(async (type: "drivers_license" | "car_insurance", file: File) => {
    const isLicense = type === "drivers_license";
    if (isLicense) setLicenseUploading(true);
    else setInsuranceUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profile.id);
      formData.append("documentType", type);

      const res = await fetch("/api/medjobs/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (isMountedRef.current) {
          setError(data.error || "Upload failed");
        }
        return;
      }

      if (isMountedRef.current) {
        const fileInfo = { name: file.name, type: file.type, size: file.size };
        if (isLicense) {
          setLicenseUploaded(true);
          setLicenseFile(fileInfo);
        } else {
          setInsuranceUploaded(true);
          setInsuranceFile(fileInfo);
        }
      }
    } catch {
      if (isMountedRef.current) {
        setError("Network error. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        if (isLicense) setLicenseUploading(false);
        else setInsuranceUploading(false);
      }
    }
  }, [profile.id]);

  async function handleExpirationChange(type: "drivers_license" | "car_insurance", date: string) {
    const isLicense = type === "drivers_license";
    if (isLicense) setLicenseExpiration(date);
    else setInsuranceExpiration(date);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          [isLicense ? "drivers_license_expiration" : "car_insurance_expiration"]: date || null,
        },
      });
    } catch {
      // Ignore save errors for expiration dates - they're not critical
    }
  }

  async function handleDeleteDocument(type: "drivers_license" | "car_insurance") {
    const isLicense = type === "drivers_license";
    if (isLicense) setLicenseDeleting(true);
    else setInsuranceDeleting(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          [isLicense ? "drivers_license_url" : "car_insurance_url"]: null,
          [isLicense ? "drivers_license_expiration" : "car_insurance_expiration"]: null,
        },
      });

      if (isMountedRef.current) {
        if (isLicense) {
          setLicenseUploaded(false);
          setLicenseFile(null);
          setLicenseExpiration("");
        } else {
          setInsuranceUploaded(false);
          setInsuranceFile(null);
          setInsuranceExpiration("");
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to delete document");
      }
    } finally {
      if (isMountedRef.current) {
        if (isLicense) setLicenseDeleting(false);
        else setInsuranceDeleting(false);
      }
    }
  }

  const handleDrag = useCallback((e: React.DragEvent, type: "license" | "insurance", active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "license") setLicenseDragActive(active);
    else setInsuranceDragActive(active);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: "drivers_license" | "car_insurance") => {
    e.preventDefault();
    e.stopPropagation();
    setLicenseDragActive(false);
    setInsuranceDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDocumentUpload(type, file);
    }
  }, [handleDocumentUpload]);

  async function handleDone() {
    // If user is editing URL but it's invalid, show error
    if (isEditingUrl && videoUrl.trim() && !hasValidVideo) {
      setError("Please enter a valid YouTube, Loom, or Vimeo URL, or click Cancel to keep your current video");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // If user is editing URL and it's valid, save it first
      if (isEditingUrl && hasValidVideo && videoUrl !== originalVideoUrl) {
        const videoSuccess = await submitVideo(videoUrl);
        if (!videoSuccess) {
          setSaving(false);
          return;
        }
      }

      // Save expiration dates if changed
      if (licenseExpiration !== (meta.drivers_license_expiration || "") ||
          insuranceExpiration !== (meta.car_insurance_expiration || "")) {
        await saveStudentProfile({
          profileId: profile.id,
          metadataFields: {
            drivers_license_expiration: licenseExpiration || null,
            car_insurance_expiration: insuranceExpiration || null,
          },
        });
      }

      onSaved();
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }

  const isUploading = licenseUploading || insuranceUploading || licenseDeleting || insuranceDeleting || videoSubmitting;

  // Render video preview based on platform
  const renderVideoPreview = () => {
    if (!hasValidVideo) return null;

    const { platform, id } = videoInfo;

    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-sm">
        {platform === "youtube" && (
          <iframe
            src={`https://www.youtube.com/embed/${id}`}
            title="Video preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
        {platform === "loom" && (
          <iframe
            src={`https://www.loom.com/embed/${id}`}
            title="Video preview"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
        {platform === "vimeo" && (
          <iframe
            src={`https://player.vimeo.com/video/${id}`}
            title="Video preview"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
    );
  };

  // Footer
  const footerContent = (
    <div className="pt-4 border-t border-gray-100">
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
          onClick={guidedMode && onGuidedBack ? onGuidedBack : onClose}
          disabled={saving || videoSubmitting}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          {guidedMode && onGuidedBack ? "Back" : "Cancel"}
        </button>

        {guidedMode && guidedStep && guidedTotal && (
          <span className="text-xs text-gray-400">
            Step {guidedStep} of {guidedTotal}
          </span>
        )}

        <button
          type="button"
          onClick={handleDone}
          disabled={isUploading || saving}
          className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            guidedMode ? "Save & Next" : "Done"
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
      <div className="space-y-6">
        {/* Video Section - Primary Focus */}
        <div className="px-2">
          {/* Header */}
          <div className="mb-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Video Introduction</h2>
              <p className="text-gray-500 text-sm">
                Record a 2-3 minute video answering these questions.
              </p>
            </div>

            {/* The 4 questions - always visible as guidance */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What to cover:</p>
              <ol className="space-y-2.5 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-primary-600 font-semibold shrink-0">1.</span>
                  <span><strong>Your qualifications</strong> — caregiving experience with older adults, family members, or in clinical settings</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary-600 font-semibold shrink-0">2.</span>
                  <span><strong>Why caregiving?</strong> — your motivation and how this benefits your career goals</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary-600 font-semibold shrink-0">3.</span>
                  <span><strong>Handling stress</strong> — how you stay calm and professional in difficult situations</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary-600 font-semibold shrink-0">4.</span>
                  <span><strong>Professionalism</strong> — how you&apos;ll represent yourself and your university with integrity</span>
                </li>
              </ol>
              {!videoSaved && (
                <p className="text-xs text-amber-600 pt-1">
                  Applications without a video will not be reviewed.
                </p>
              )}
            </div>
          </div>

          {/* Video Content */}
          {videoSaved && !isEditingUrl ? (
            // Saved video state - show preview with actions
            <div className="space-y-4">
              {renderVideoPreview()}

              {/* Status and actions */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Video saved</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={startEditingUrl}
                    disabled={videoSubmitting}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={deleteVideo}
                    disabled={videoSubmitting}
                    className="text-sm font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {videoSubmitting ? "..." : "Remove"}
                  </button>
                </div>
              </div>

              {/* Warning about removing */}
              <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
                Removing your video will take your profile offline
              </p>
            </div>
          ) : (
            // Input state - entering or editing URL
            <div className="space-y-4">
              {/* Show preview above input if valid */}
              {hasValidVideo && (
                <div className="space-y-3">
                  {renderVideoPreview()}
                  <div className="flex items-center justify-center gap-2 text-sm text-primary-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Preview looks good</span>
                  </div>
                </div>
              )}

              {/* URL Input - always show so user can edit */}
              <div className="max-w-md mx-auto space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    onBlur={handleVideoBlur}
                    placeholder="Paste YouTube, Loom, or Vimeo link..."
                    className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all placeholder:text-gray-400 ${
                      showInvalidUrlHint ? "border-amber-300" : "border-gray-200"
                    }`}
                    autoFocus={!hasValidVideo}
                  />
                  {videoSubmitting && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Hint text or validation error */}
                {showInvalidUrlHint ? (
                  <p className="text-xs text-amber-600 text-center">
                    Please use a YouTube, Loom, or Vimeo link
                  </p>
                ) : !hasValidVideo ? (
                  <p className="text-xs text-gray-400 text-center">
                    Supported: YouTube, Loom, Vimeo
                  </p>
                ) : null}
              </div>

              {/* Action buttons when editing existing video */}
              {isEditingUrl && originalVideoUrl && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={cancelEditUrl}
                    disabled={videoSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  {hasValidVideo && videoUrl !== originalVideoUrl && (
                    <button
                      type="button"
                      onClick={saveNewUrl}
                      disabled={videoSubmitting}
                      className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {videoSubmitting ? "Saving..." : "Save"}
                    </button>
                  )}
                </div>
              )}

              {/* Save button for new video (not editing existing) */}
              {!isEditingUrl && !originalVideoUrl && hasValidVideo && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={saveNewUrl}
                    disabled={videoSubmitting}
                    className="px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {videoSubmitting ? "Saving..." : "Save video"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optional Documents Section */}
        <div className="border-t border-gray-100 pt-5 px-2">
          <button
            type="button"
            onClick={() => setShowDocuments(!showDocuments)}
            className="w-full flex items-center justify-between py-2 px-1 rounded-lg hover:bg-gray-50 transition-colors -mx-1"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Optional Documents</span>
              {(licenseUploaded || insuranceUploaded) && (
                <div className="flex items-center gap-1.5">
                  {licenseUploaded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      License
                    </span>
                  )}
                  {insuranceUploaded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Insurance
                    </span>
                  )}
                </div>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showDocuments ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDocuments && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Driver's License */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Driver&apos;s License</span>
                  </div>
                  {licenseUploaded && (
                    <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {licenseUploaded ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-600 flex-1 truncate">
                        {licenseFile?.name || "Uploaded"}
                      </span>
                      <button
                        type="button"
                        onClick={() => licenseInputRef.current?.click()}
                        disabled={licenseDeleting}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex-shrink-0 disabled:opacity-50"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument("drivers_license")}
                        disabled={licenseDeleting}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex-shrink-0 disabled:opacity-50"
                      >
                        {licenseDeleting ? "..." : "Delete"}
                      </button>
                    </div>
                    <input
                      type="date"
                      value={licenseExpiration}
                      onChange={(e) => handleExpirationChange("drivers_license", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-all"
                      placeholder="Expiration"
                    />
                  </div>
                ) : (
                  <div
                    onDragEnter={(e) => handleDrag(e, "license", true)}
                    onDragLeave={(e) => handleDrag(e, "license", false)}
                    onDragOver={(e) => handleDrag(e, "license", true)}
                    onDrop={(e) => handleDrop(e, "drivers_license")}
                    onClick={() => licenseInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center py-6 px-4 bg-white border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      licenseDragActive
                        ? "border-primary-500 bg-primary-50"
                        : licenseUploading
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {licenseUploading ? (
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-xs text-gray-500">Upload</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Car Insurance */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Car Insurance</span>
                  </div>
                  {insuranceUploaded && (
                    <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {insuranceUploaded ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-600 flex-1 truncate">
                        {insuranceFile?.name || "Uploaded"}
                      </span>
                      <button
                        type="button"
                        onClick={() => insuranceInputRef.current?.click()}
                        disabled={insuranceDeleting}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex-shrink-0 disabled:opacity-50"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument("car_insurance")}
                        disabled={insuranceDeleting}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex-shrink-0 disabled:opacity-50"
                      >
                        {insuranceDeleting ? "..." : "Delete"}
                      </button>
                    </div>
                    <input
                      type="date"
                      value={insuranceExpiration}
                      onChange={(e) => handleExpirationChange("car_insurance", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none transition-all"
                      placeholder="Expiration"
                    />
                  </div>
                ) : (
                  <div
                    onDragEnter={(e) => handleDrag(e, "insurance", true)}
                    onDragLeave={(e) => handleDrag(e, "insurance", false)}
                    onDragOver={(e) => handleDrag(e, "insurance", true)}
                    onDrop={(e) => handleDrop(e, "car_insurance")}
                    onClick={() => insuranceInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center py-6 px-4 bg-white border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      insuranceDragActive
                        ? "border-primary-500 bg-primary-50"
                        : insuranceUploading
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {insuranceUploading ? (
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-xs text-gray-500">Upload</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={licenseInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload("drivers_license", file);
                  e.target.value = ""; // Reset to allow re-upload of same file
                }}
              />
              <input
                ref={insuranceInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload("car_insurance", file);
                  e.target.value = ""; // Reset to allow re-upload of same file
                }}
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
