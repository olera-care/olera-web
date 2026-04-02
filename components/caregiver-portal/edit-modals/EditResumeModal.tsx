"use client";

import { useState, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

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

  const [linkedinUrl, setLinkedinUrl] = useState(meta.linkedin_url || "");
  const [resumeUrl, setResumeUrl] = useState(meta.resume_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    linkedinUrl !== (meta.linkedin_url || "") ||
    resumeUrl !== (meta.resume_url || "");

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          linkedin_url: linkedinUrl.trim() || null,
          resume_url: resumeUrl || null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const handleUpload = async (file: File) => {
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

      // Update local state with new URL
      if (data.url) {
        setResumeUrl(data.url);
      }
    } catch {
      setError("Network error.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Resume & LinkedIn"
      size="2xl"
      footer={
        <ModalFooter
          saving={saving}
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
        {/* Resume upload */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Resume</label>
          <p className="text-sm text-gray-500 mb-2">Upload a PDF of your resume. A strong caregiver resume includes:</p>
          <ul className="text-sm text-gray-500 mb-3 space-y-1 ml-4 list-disc">
            <li>Any caregiving, volunteer, or clinical experience</li>
            <li>Relevant coursework and certifications (CNA, BLS, CPR)</li>
            <li>Soft skills: communication, empathy, reliability</li>
            <li>References from professors, coaches, or supervisors</li>
          </ul>

          {resumeUrl ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg mb-3">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-emerald-700">Resume uploaded</span>
            </div>
          ) : null}

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
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {uploading ? "Uploading..." : resumeUrl ? "Replace resume" : "Upload resume (PDF)"}
          </button>
        </div>

        {/* LinkedIn URL */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">LinkedIn URL</label>
          <p className="text-sm text-gray-500 mb-2">Add your LinkedIn profile so providers can learn more about your background.</p>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
            className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
