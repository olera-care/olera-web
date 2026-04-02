"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "No experience yet — eager to learn" },
  { value: "family", label: "Informal experience (family, friends, volunteering)" },
  { value: "1", label: "1–2 years (paid or volunteer caregiving)" },
  { value: "3", label: "3+ years (professional or consistent caregiving)" },
];

const CERTIFICATION_OPTIONS = [
  "CPR / First Aid",
  "BLS",
  "CNA",
  "HHA / Home Health Aide",
  "Medication Aide",
  "Dementia / Alzheimer's Care",
  "Mental Health First Aid",
  "OSHA / Infection Control",
  "No certifications yet — willing to get certified as required",
];

const CARE_TYPE_OPTIONS = [
  // ADLs (Activities of Daily Living)
  "Bathing & Personal Hygiene",
  "Dressing & Grooming",
  "Toileting & Incontinence Care",
  "Feeding & Meal Preparation",
  "Mobility & Transfers",
  "Medication Reminders",
  // IADLs (Instrumental Activities of Daily Living)
  "Light Housekeeping & Laundry",
  "Grocery Shopping & Errands",
  "Transportation to Appointments",
  "Companionship & Social Engagement",
  // Specialized
  "Dementia / Alzheimer's Support",
  "Post-Surgical / Recovery Care",
  "Hospice / End-of-Life Comfort",
  "Respite Care (relief for family caregivers)",
  // Growth mindset
  "Willing to learn and expand my scope of care",
];

const CARE_TYPE_MIN = 3;

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "French",
  "Haitian Creole",
  "Portuguese",
  "Mandarin",
  "Cantonese",
  "Vietnamese",
  "Tagalog",
  "Korean",
  "Arabic",
  "Amharic",
  "ASL (American Sign Language)",
  "Other",
];

export default function EditBackgroundModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;

  const [yearsExperience, setYearsExperience] = useState<string>(
    meta.years_caregiving != null ? String(meta.years_caregiving) : ""
  );
  const [certifications, setCertifications] = useState<string[]>(meta.certifications || []);
  const [careTypes, setCareTypes] = useState<string[]>(meta.care_experience_types || []);
  const [languages, setLanguages] = useState<string[]>(meta.languages || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalYears = meta.years_caregiving != null ? String(meta.years_caregiving) : "";
  const hasChanges =
    yearsExperience !== originalYears ||
    JSON.stringify(certifications) !== JSON.stringify(meta.certifications || []) ||
    JSON.stringify(careTypes) !== JSON.stringify(meta.care_experience_types || []) ||
    JSON.stringify(languages) !== JSON.stringify(meta.languages || []);

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
          years_caregiving: yearsExperience === "family" ? 0 : yearsExperience ? Number(yearsExperience) : null,
          certifications,
          care_experience_types: careTypes,
          languages,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const toggleArrayItem = (
    current: string[],
    setter: (val: string[]) => void,
    item: string
  ) => {
    if (current.includes(item)) {
      setter(current.filter((i) => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Experience & Background"
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
        {/* Experience level */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Experience level</label>
          <p className="text-xs text-gray-500 mb-2">Providers value honesty — many hire students with no prior experience.</p>
          <div className="flex flex-wrap gap-1.5">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setYearsExperience(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  yearsExperience === opt.value ||
                  (opt.value === "family" && yearsExperience === "0") ||
                  (opt.value === "0" && yearsExperience === "0" && opt.label.includes("No experience"))
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Certifications</label>
          <p className="text-xs text-gray-500 mb-2">Select any you currently hold. Many agencies will train you on the job.</p>
          <div className="flex flex-wrap gap-1.5">
            {CERTIFICATION_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleArrayItem(certifications, setCertifications, c)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  certifications.includes(c)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Care types */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Types of care you would like to provide</label>
          <p className="text-xs text-gray-500 mb-2">Select all that apply — include care you&apos;re willing to learn. Providers prioritize students open to a broad scope.</p>
          <div className="flex flex-wrap gap-1.5">
            {CARE_TYPE_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleArrayItem(careTypes, setCareTypes, c)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  careTypes.includes(c)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {careTypes.length > 0 && careTypes.length < CARE_TYPE_MIN && (
            <p className="text-xs text-amber-500 mt-2">
              Providers prioritize students willing to learn and provide a wider range of care. Consider selecting at least {CARE_TYPE_MIN} types.
            </p>
          )}
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Languages</label>
          <p className="text-xs text-gray-500 mb-2">Clients and their families speak many languages — select all you can communicate in.</p>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleArrayItem(languages, setLanguages, l)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  languages.includes(l)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
