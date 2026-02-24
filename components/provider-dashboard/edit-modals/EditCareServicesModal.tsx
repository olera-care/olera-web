"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

const COMMON_SERVICES = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
  "Respite Care",
  "Adult Day Care",
  "Rehabilitation",
  "Dementia Care",
  "Personal Care",
  "Companion Care",
  "Medication Management",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Transportation",
  "Meal Preparation",
  "Housekeeping",
];

export default function EditCareServicesModal({
  profile,
  metadata,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const [selected, setSelected] = useState<string[]>(
    [...(profile.care_types || [])]
  );
  const [customService, setCustomService] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    JSON.stringify(selected.sort()) !==
    JSON.stringify([...(profile.care_types || [])].sort());

  function toggle(service: string) {
    setSelected((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  }

  function addCustom() {
    const trimmed = customService.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
    }
    setCustomService("");
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
        topLevelFields: { care_types: selected },
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
    <Modal isOpen onClose={onClose} title="Care Services" size="lg">
      <div className="space-y-5 pt-2">
        <p className="text-sm text-warm-600">
          Select all services your organization provides.
        </p>

        <div className="flex flex-wrap gap-2">
          {COMMON_SERVICES.map((service) => {
            const isSelected = selected.includes(service);
            return (
              <button
                key={service}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => toggle(service)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  isSelected
                    ? "bg-primary-50 border-primary-300 text-primary-700"
                    : "bg-white border-warm-100 text-warm-600 hover:border-warm-200"
                }`}
              >
                {service}
              </button>
            );
          })}
          {/* Show custom services that aren't in the predefined list */}
          {selected
            .filter((s) => !COMMON_SERVICES.includes(s))
            .map((service) => (
              <button
                key={service}
                type="button"
                role="checkbox"
                aria-checked
                onClick={() => toggle(service)}
                className="px-3.5 py-2 rounded-xl text-sm font-medium border bg-primary-50 border-primary-300 text-primary-700 transition-all duration-200"
              >
                {service}
              </button>
            ))}
        </div>

        {/* Add custom service */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="Add custom service"
              value={customService}
              onChange={(e) => setCustomService((e.target as HTMLInputElement).value)}
              placeholder="e.g. Pet Therapy"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={addCustom}
            disabled={!customService.trim()}
            className="self-end px-4 py-3 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

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
