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
  const hasSchedule = grid.flat().some(Boolean);

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
      title=""
      size="2xl"
      footer={footerContent}
    >
      <div className="px-2">
        {/* Header section */}
        <div className="text-center mb-6">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Your class schedule
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Tap the times when you have class. Everything else shows as available for shifts.
          </p>

          {/* Semester badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary-600" />
            <span className="text-xs font-medium text-gray-700">{currentSemester}</span>
          </div>
        </div>

        {/* Stale warning */}
        {stale && (
          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">Schedule needs update</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Last updated for {meta.course_schedule_semester}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Builder */}
        <div className="max-w-lg mx-auto">
          <ScheduleBuilder value={grid} onChange={setGrid} />
        </div>

        {/* Tip */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Remember to update this each semester
        </p>

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
