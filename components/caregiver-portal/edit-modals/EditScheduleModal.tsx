"use client";

import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { ScheduleBuilder, parseSchedule, serializeSchedule } from "@/components/medjobs/ScheduleBuilder";
import type { AvailabilitySchedule } from "@/components/medjobs/ScheduleBuilder";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

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

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Load from new field first, fall back to old grid format
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(() => {
    if (meta.availability_schedule) return meta.availability_schedule;
    return parseSchedule(meta.course_schedule_grid);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalSchedule = meta.availability_schedule || parseSchedule(meta.course_schedule_grid);
  const hasChanges = JSON.stringify(schedule) !== JSON.stringify(originalSchedule);
  const hasAnySlots = Object.values(schedule).some((slots) => slots.length > 0);

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
          availability_schedule: schedule,
          // Also write old field so card/completeness still works during migration
          course_schedule_grid: serializeSchedule(schedule),
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }

  function handleBack() {
    if (guidedMode && onGuidedBack) onGuidedBack();
    else onClose();
  }

  const headerContent = (
    <div>
      <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900">Weekly Availability</h2>
    </div>
  );

  const footerContent = (
    <div className="pt-4 border-t border-gray-100">
      {guidedMode && guidedStep && guidedTotal && (
        <div className="flex gap-0.5 px-1 mb-4">
          {Array.from({ length: guidedTotal }, (_, i) => (
            <div key={i} className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${i + 1 <= guidedStep ? "bg-primary-600" : "bg-gray-100"}`} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          {guidedMode && onGuidedBack ? "Back" : "Cancel"}
        </button>
        {guidedMode && guidedStep && guidedTotal && (
          <span className="text-xs text-gray-400">Step {guidedStep} of {guidedTotal}</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            hasAnySlots || hasChanges
              ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : guidedMode ? "Save & Next" : "Save"}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title={headerContent} size="2xl" footer={footerContent}>
      <div className="pt-4">
        <div className="max-w-xl mx-auto">
          <ScheduleBuilder value={schedule} onChange={setSchedule} />
        </div>
        {error && (
          <div className="mx-auto max-w-md mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
