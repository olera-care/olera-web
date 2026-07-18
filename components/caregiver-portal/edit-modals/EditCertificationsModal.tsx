"use client";

import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

const CERTIFICATION_OPTIONS = [
  "CNA",
  "BLS",
  "CPR / First Aid",
  "HHA",
  "Medication Aide",
  "Phlebotomy",
  "CPI / De-escalation",
  "Dementia Care Training",
  "Fall Prevention",
];

export default function EditCertificationsModal({
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

  const [certifications, setCertifications] = useState<string[]>(meta.certifications || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = JSON.stringify(certifications) !== JSON.stringify(meta.certifications || []);

  function toggle(item: string) {
    setCertifications((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: { certifications },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }

  const footerContent = (
    <div className="pt-4 border-t border-gray-100">
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
          onClick={guidedMode && onGuidedBack ? onGuidedBack : onClose}
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
          disabled={saving || (!hasChanges && !guidedMode)}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            certifications.length > 0
              ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : guidedMode ? "Save & Next" : "Done"}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="" size="2xl" footer={footerContent}>
      <div className="px-2">
        <div className="min-h-[360px] flex items-start justify-center pt-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Certifications</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              Select all that apply. No certifications? No problem — you can skip this.
            </p>

            <div className="max-w-md mx-auto flex flex-wrap justify-center gap-2">
              {CERTIFICATION_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(c)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    certifications.includes(c)
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {certifications.length > 0 && (
              <p className="text-xs text-primary-600 mt-6">
                {certifications.length} selected
              </p>
            )}
          </div>
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
