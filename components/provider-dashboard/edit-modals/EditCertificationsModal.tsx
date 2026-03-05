"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

const COMMON_CERTIFICATIONS = [
  "CNA (Certified Nursing Assistant)",
  "HHA (Home Health Aide)",
  "CPR / First Aid",
  "BLS (Basic Life Support)",
  "Medication Administration",
  "Dementia / Alzheimer's Care",
  "Hospice & Palliative Care",
  "Wound Care",
  "Physical Therapy Aide",
];

export default function EditCertificationsModal({
  profile,
  metadata,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const [certifications, setCertifications] = useState<string[]>(
    metadata.certifications || []
  );
  const [customCert, setCustomCert] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalCerts = metadata.certifications || [];
  const hasChanges =
    JSON.stringify([...certifications].sort()) !==
    JSON.stringify([...originalCerts].sort());

  function toggleCert(cert: string) {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  }

  function addCustomCert() {
    const trimmed = customCert.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications((prev) => [...prev, trimmed]);
    }
    setCustomCert("");
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
        metadataFields: {
          certifications: certifications.length > 0 ? certifications : undefined,
        },
        existingMetadata: (profile.metadata || {}) as Record<string, unknown>,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Certifications"
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
      <div className="space-y-5 pt-2">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-3">
            Select your certifications
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_CERTIFICATIONS.map((cert) => {
              const isSelected = certifications.includes(cert);
              return (
                <button
                  key={cert}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggleCert(cert)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    isSelected
                      ? "bg-secondary-50 border-secondary-300 text-secondary-700"
                      : "bg-white border-warm-100 text-gray-900 hover:border-warm-200"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-secondary-600 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {cert}
                </button>
              );
            })}
            {/* Custom certs not in the predefined list */}
            {certifications
              .filter((c) => !COMMON_CERTIFICATIONS.includes(c))
              .map((cert) => (
                <button
                  key={cert}
                  type="button"
                  role="checkbox"
                  aria-checked
                  onClick={() => toggleCert(cert)}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium border bg-secondary-50 border-secondary-300 text-secondary-700 transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5 text-secondary-600 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {cert}
                </button>
              ))}
          </div>
        </div>

        {/* Custom certification input */}
        <Input
          label="Add custom certification"
          value={customCert}
          onChange={(e) => setCustomCert((e.target as HTMLInputElement).value)}
          placeholder="e.g. IV Therapy Certification"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomCert();
            }
          }}
        />

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
