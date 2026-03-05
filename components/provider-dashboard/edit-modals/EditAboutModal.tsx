"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { saveProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

export default function EditAboutModal({
  profile,
  metadata,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const isCaregiver = profile.type === "caregiver";
  const [description, setDescription] = useState(profile.description || "");

  // Organization fields
  const [yearFounded, setYearFounded] = useState(
    metadata.year_founded ? String(metadata.year_founded) : ""
  );
  const [bedCount, setBedCount] = useState(
    metadata.bed_count ? String(metadata.bed_count) : ""
  );
  const [staffCount, setStaffCount] = useState(
    metadata.staff_count ? String(metadata.staff_count) : ""
  );
  const [licenseNumber, setLicenseNumber] = useState(
    metadata.license_number || ""
  );

  // Caregiver fields
  const [yearsExperience, setYearsExperience] = useState(
    metadata.years_experience != null ? String(metadata.years_experience) : ""
  );
  const [languages, setLanguages] = useState(
    (metadata.languages || []).join(", ")
  );
  const [availability, setAvailability] = useState(
    metadata.availability || ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = isCaregiver
    ? description !== (profile.description || "") ||
      yearsExperience !== (metadata.years_experience != null ? String(metadata.years_experience) : "") ||
      languages !== (metadata.languages || []).join(", ") ||
      availability !== (metadata.availability || "")
    : description !== (profile.description || "") ||
      yearFounded !== (metadata.year_founded ? String(metadata.year_founded) : "") ||
      bedCount !== (metadata.bed_count ? String(metadata.bed_count) : "") ||
      staffCount !== (metadata.staff_count ? String(metadata.staff_count) : "") ||
      licenseNumber !== (metadata.license_number || "");

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const metadataFields = isCaregiver
        ? {
            years_experience: yearsExperience ? Number(yearsExperience) : undefined,
            languages: languages.trim()
              ? languages.split(",").map((l) => l.trim()).filter(Boolean)
              : undefined,
            availability: availability.trim() || undefined,
          }
        : {
            year_founded: yearFounded ? Number(yearFounded) : undefined,
            bed_count: bedCount ? Number(bedCount) : undefined,
            staff_count: staffCount ? Number(staffCount) : undefined,
            license_number: licenseNumber || undefined,
          };

      await saveProfile({
        profileId: profile.id,
        topLevelFields: { description: description || null },
        metadataFields,
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
      title="Edit About"
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
        <Input
          as="textarea"
          label="Description"
          value={description}
          onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          rows={4}
          placeholder={isCaregiver
            ? "Tell families what makes you a great caregiver..."
            : "Tell families what makes your organization special..."}
        />

        {isCaregiver ? (
          <>
            <Input
              label="Years of experience"
              type="number"
              value={yearsExperience}
              onChange={(e) => setYearsExperience((e.target as HTMLInputElement).value)}
              placeholder="e.g. 5"
              min="0"
              max="60"
            />
            <Input
              label="Languages"
              value={languages}
              onChange={(e) => setLanguages((e.target as HTMLInputElement).value)}
              placeholder="e.g. English, Spanish"
            />
            <Input
              label="Availability"
              value={availability}
              onChange={(e) => setAvailability((e.target as HTMLInputElement).value)}
              placeholder="e.g. Full-time, Weekdays"
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Year Founded"
                type="number"
                value={yearFounded}
                onChange={(e) => setYearFounded((e.target as HTMLInputElement).value)}
                placeholder="e.g. 2005"
              />
              <Input
                label="License Number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber((e.target as HTMLInputElement).value)}
                placeholder="e.g. AL-12345"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bed Count"
                type="number"
                value={bedCount}
                onChange={(e) => setBedCount((e.target as HTMLInputElement).value)}
                placeholder="e.g. 48"
              />
              <Input
                label="Staff Count"
                type="number"
                value={staffCount}
                onChange={(e) => setStaffCount((e.target as HTMLInputElement).value)}
                placeholder="e.g. 25"
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
