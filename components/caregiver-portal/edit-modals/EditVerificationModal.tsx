"use client";

import { useState, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

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

  // Video
  const [videoUrl, setVideoUrl] = useState(meta.video_intro_url || "");
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [videoSubmitted, setVideoSubmitted] = useState(!!meta.video_intro_url);

  // Driver's license
  const [licenseUploaded, setLicenseUploaded] = useState(!!meta.drivers_license_url);
  const [licenseExpiration, setLicenseExpiration] = useState(meta.drivers_license_expiration || "");
  const [licenseUploading, setLicenseUploading] = useState(false);

  // Car insurance
  const [insuranceUploaded, setInsuranceUploaded] = useState(!!meta.car_insurance_url);
  const [insuranceExpiration, setInsuranceExpiration] = useState(meta.car_insurance_expiration || "");
  const [insuranceUploading, setInsuranceUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  // Transportation attestation
  const [transportAttestation, setTransportAttestation] = useState(!!meta.transportation);

  // Track if any verification item is complete
  const hasVideo = videoSubmitted || !!videoUrl.trim();
  const hasLicense = licenseUploaded && !!licenseExpiration;
  const hasInsurance = insuranceUploaded && !!insuranceExpiration;

  // Has changes if any new data
  const hasChanges =
    (videoUrl.trim() && videoUrl !== (meta.video_intro_url || "")) ||
    licenseExpiration !== (meta.drivers_license_expiration || "") ||
    insuranceExpiration !== (meta.car_insurance_expiration || "") ||
    transportAttestation !== !!meta.transportation;

  async function handleVideoSubmit() {
    if (!videoUrl.trim()) return;
    setVideoSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/medjobs/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: profile.slug, videoUrl: videoUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit video");
        return;
      }

      setVideoSubmitted(true);
    } catch {
      setError("Network error");
    } finally {
      setVideoSubmitting(false);
    }
  }

  async function handleDocumentUpload(type: "drivers_license" | "car_insurance", file: File) {
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
        setError(data.error || "Upload failed");
        return;
      }

      if (isLicense) setLicenseUploaded(true);
      else setInsuranceUploaded(true);
    } catch {
      setError("Network error");
    } finally {
      if (isLicense) setLicenseUploading(false);
      else setInsuranceUploading(false);
    }
  }

  async function handleExpirationChange(type: "drivers_license" | "car_insurance", date: string) {
    const isLicense = type === "drivers_license";
    if (isLicense) setLicenseExpiration(date);
    else setInsuranceExpiration(date);

    // Auto-save expiration date
    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          [isLicense ? "drivers_license_expiration" : "car_insurance_expiration"]: date || null,
        },
      });
    } catch {
      // Ignore save errors for expiration dates
    }
  }

  async function handleSave() {
    // In guided mode, just proceed to next step
    if (guidedMode) {
      onSaved();
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          drivers_license_expiration: licenseExpiration || null,
          car_insurance_expiration: insuranceExpiration || null,
          transportation: transportAttestation || null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const isUploading = licenseUploading || insuranceUploading || videoSubmitting;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Verification"
      size="lg"
      footer={
        <ModalFooter
          saving={saving || isUploading}
          hasChanges={hasChanges || !!guidedMode}
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
        <p className="text-sm text-gray-500">
          We verify every student to protect the families you&apos;ll care for. Complete these items to go live.
        </p>

        {/* Intro Video */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              hasVideo ? "bg-emerald-100" : "bg-gray-100"
            }`}>
              <svg className={`w-5 h-5 ${hasVideo ? "text-emerald-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Intro Video</h4>
                {hasVideo && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Done</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">2-3 min — providers want to see who they&apos;re hiring</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste YouTube or Loom link"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none"
                />
                <button
                  type="button"
                  onClick={handleVideoSubmit}
                  disabled={!videoUrl.trim() || videoSubmitting}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {videoSubmitting ? "..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Driver's License */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              hasLicense ? "bg-emerald-100" : "bg-gray-100"
            }`}>
              <svg className={`w-5 h-5 ${hasLicense ? "text-emerald-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Driver&apos;s License</h4>
                {hasLicense && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Done</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Verifies your identity</p>
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expiration date</label>
                  <input
                    type="date"
                    value={licenseExpiration}
                    onChange={(e) => handleExpirationChange("drivers_license", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none"
                  />
                </div>
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocumentUpload("drivers_license", file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => licenseInputRef.current?.click()}
                  disabled={licenseUploading}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  {licenseUploading ? "Uploading..." : licenseUploaded ? "Replace document" : "Upload document"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Car Insurance */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              hasInsurance ? "bg-emerald-100" : "bg-gray-100"
            }`}>
              <svg className={`w-5 h-5 ${hasInsurance ? "text-emerald-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Car Insurance</h4>
                {hasInsurance && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Done</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Confirms you can get to assignments safely</p>
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expiration date</label>
                  <input
                    type="date"
                    value={insuranceExpiration}
                    onChange={(e) => handleExpirationChange("car_insurance", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-100 outline-none"
                  />
                </div>
                <input
                  ref={insuranceInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocumentUpload("car_insurance", file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => insuranceInputRef.current?.click()}
                  disabled={insuranceUploading}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  {insuranceUploading ? "Uploading..." : insuranceUploaded ? "Replace document" : "Upload document"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transportation Attestation */}
        <div className="p-4 rounded-xl border border-gray-200 bg-amber-50/50">
          <button
            type="button"
            onClick={() => setTransportAttestation(!transportAttestation)}
            className="w-full flex items-start gap-3 text-left"
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 mt-0.5 transition-colors ${
              transportAttestation ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300"
            }`}>
              {transportAttestation && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">I have access to a reliable, safe vehicle</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                I confirm my vehicle is safe for transporting myself to client locations and, when needed, for driving clients to appointments or errands. Only clients who are safe to transport without specialized equipment would be assigned.
              </p>
            </div>
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
      </div>
    </Modal>
  );
}
