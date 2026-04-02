"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { ScheduleBuilder, parseSchedule, serializeSchedule } from "@/components/medjobs/ScheduleBuilder";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 0 && month <= 4) return `Spring ${year}`;
  if (month >= 5 && month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

export default function EditScheduleModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;
  const currentSemester = getCurrentSemester();
  const stale = meta.course_schedule_semester && meta.course_schedule_semester !== currentSemester;

  const [grid, setGrid] = useState(() => parseSchedule(meta.course_schedule_grid));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if grid has changed from original
  const originalGrid = parseSchedule(meta.course_schedule_grid);
  const hasChanges = JSON.stringify(grid) !== JSON.stringify(originalGrid);

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
          course_schedule_grid: serializeSchedule(grid),
          course_schedule_semester: currentSemester,
        },
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
      title="Edit Semester Schedule"
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
      <div className="space-y-4 pt-4">
        {stale && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/60">
            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-700">
              Your schedule is from {meta.course_schedule_semester}. Please update it for {currentSemester}.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500">
          Tap to mark when you have class. Everything else = available for shifts. Update each semester.
        </p>

        <ScheduleBuilder value={grid} onChange={setGrid} />

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
      </div>
    </Modal>
  );
}
