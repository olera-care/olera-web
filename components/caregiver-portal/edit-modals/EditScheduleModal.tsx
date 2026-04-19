"use client";

import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { ScheduleBuilder, parseSchedule, serializeSchedule } from "@/components/medjobs/ScheduleBuilder";
import { saveStudentProfile } from "./save-profile";
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

  // Track mounted state
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [grid, setGrid] = useState(() => parseSchedule(meta.course_schedule_grid));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if grid has changed from original
  const originalGrid = parseSchedule(meta.course_schedule_grid);
  const hasChanges = JSON.stringify(grid) !== JSON.stringify(originalGrid);

  // Check if any slots are selected
  const hasSchedule = Object.values(grid).some((v) => v === true);

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
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (guidedMode && onGuidedBack) {
      onGuidedBack();
    } else {
      onClose();
    }
  }

  const getButtonText = () => {
    return saving ? "Saving..." : guidedMode ? "Save & Next" : "Save";
  };

  const getBackButtonText = () => {
    return guidedMode && onGuidedBack ? "Back" : "Cancel";
  };

  // Custom header with title and subtitle
  const headerContent = (
    <div>
      <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900">Semester Schedule</h2>
      <p className="text-sm text-gray-500 mt-0.5">Tap times when you have class</p>
    </div>
  );

  // Footer component
  const footerContent = (
    <div className="pt-4 border-t border-gray-100">
      {/* Guided mode progress bar */}
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
          onClick={handleBack}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          {getBackButtonText()}
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          {guidedMode && guidedStep && guidedTotal && (
            <span>Step {guidedStep} of {guidedTotal}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            hasSchedule || hasChanges
              ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={headerContent}
      size="2xl"
      footer={footerContent}
    >
      <div className="pt-4">
        {/* Semester badge with update reminder */}
        <div className="flex flex-col items-center gap-1.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <div className={`w-2 h-2 rounded-full ${stale ? "bg-amber-500" : "bg-primary-600"}`} />
            <span className="text-xs font-medium text-gray-700">{currentSemester}</span>
          </div>
          <p className="text-[11px] text-gray-400">
            {stale ? (
              <>Last saved for {meta.course_schedule_semester} · <span className="text-amber-600">Please update</span></>
            ) : (
              "Update this each semester"
            )}
          </p>
        </div>

        {/* Schedule Builder */}
        <div className="max-w-lg mx-auto">
          <ScheduleBuilder value={grid} onChange={setGrid} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-auto max-w-md mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
