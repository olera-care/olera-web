"use client";

import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

export default function EditWhyModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track mounted state
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [text, setText] = useState(meta.why_caregiving || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.trim().length;
  const hasChanges = text !== (meta.why_caregiving || "");
  const isValid = charCount >= 100 && charCount <= 500;

  // Focus textarea on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }

    if (!isValid) {
      setError("Your statement needs to be between 100 and 500 characters");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          why_caregiving: text.trim(),
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
      <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900">Why Caregiving</h2>
      <p className="text-sm text-gray-500 mt-0.5">Be genuine — like a personal statement</p>
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
          disabled={saving || (!isValid && hasChanges)}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isValid
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
      <div className="pt-6 flex flex-col items-center">
        {/* Textarea */}
        <div className="w-full max-w-lg">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I want to be a caregiver because..."
            rows={7}
            maxLength={500}
            className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-2xl px-5 py-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all resize-none leading-relaxed"
          />

          {/* Character count */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className={`text-xs transition-colors ${
              charCount === 0
                ? "text-gray-400"
                : charCount < 100
                ? "text-amber-600"
                : charCount > 500
                ? "text-red-500"
                : "text-primary-600"
            }`}>
              {charCount === 0
                ? "100–500 characters"
                : charCount < 100
                ? `${100 - charCount} more characters needed`
                : `${charCount}/500`
              }
            </span>
            {isValid && (
              <div className="flex items-center gap-1.5 text-primary-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-medium">Good length</span>
              </div>
            )}
          </div>
        </div>

        {/* Tips - compact inline style */}
        <div className="w-full max-w-lg mt-6">
          <p className="text-xs text-gray-400 mb-2">Strong answers mention:</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">
              What draws you to caregiving
            </span>
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">
              Your career path connection
            </span>
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">
              A motivating experience
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-lg mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
