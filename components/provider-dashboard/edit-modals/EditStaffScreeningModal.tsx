"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

const SCREENING_FIELDS = [
  { key: "background_checked" as const, label: "Background Checked", description: "Staff have passed background checks" },
  { key: "licensed" as const, label: "Licensed", description: "Your organization holds proper licensing" },
  { key: "insured" as const, label: "Insured", description: "Liability insurance coverage is active" },
];

export default function EditStaffScreeningModal({
  profile,
  metadata,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const existing = metadata.staff_screening || {
    background_checked: false,
    licensed: false,
    insured: false,
  };

  const [values, setValues] = useState({
    background_checked: existing.background_checked,
    licensed: existing.licensed,
    insured: existing.insured,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    values.background_checked !== existing.background_checked ||
    values.licensed !== existing.licensed ||
    values.insured !== existing.insured;

  function toggle(key: keyof typeof values) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
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
        metadataFields: { staff_screening: values },
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
    <Modal isOpen onClose={onClose} title="Staff Screening" size="md">
      <div className="space-y-3 pt-2">
        {SCREENING_FIELDS.map(({ key, label, description }) => (
          <button
            key={key}
            type="button"
            role="checkbox"
            aria-checked={values[key]}
            onClick={() => toggle(key)}
            className={`w-full flex items-center gap-4 rounded-xl p-4 border transition-all duration-200 text-left ${
              values[key]
                ? "bg-primary-50/80 border-primary-200/60"
                : "bg-warm-50 border-warm-100 hover:border-warm-200"
            }`}
          >
            {/* Toggle circle */}
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                values[key]
                  ? "bg-primary-600 border-primary-600"
                  : "border-warm-300 bg-white"
              }`}
            >
              {values[key] && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-[15px] font-medium ${values[key] ? "text-primary-700" : "text-gray-700"}`}>
                {label}
              </p>
              <p className="text-sm text-warm-600 mt-0.5">{description}</p>
            </div>
          </button>
        ))}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>

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
    </Modal>
  );
}
