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
      title=""
      size="2xl"
      footer={footerContent}
    >
      <div className="px-2">
        {/* Centered content */}
        <div className="min-h-[420px] flex flex-col items-center pt-2">
          {/* Icon */}
          <div className="w-20 h-20 mb-6 rounded-full bg-primary-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            Why do you want to be a caregiver?
          </h3>
          <p className="text-gray-500 text-sm mb-8 max-w-md text-center">
            This is one of the first things providers read. Be genuine — think of it like a personal statement.
          </p>

          {/* Textarea */}
          <div className="w-full max-w-lg">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I want to be a caregiver because..."
              rows={6}
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

          {/* Tips - subtle design */}
          <div className="w-full max-w-lg mt-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs text-gray-500 space-y-2">
                <p className="font-medium text-gray-600">Strong answers include:</p>
                <ul className="space-y-1 text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-px">•</span>
                    What personally draws you to caregiving
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-px">•</span>
                    How it connects to your career path
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-px">•</span>
                    A specific experience that motivated you
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-auto max-w-lg mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
