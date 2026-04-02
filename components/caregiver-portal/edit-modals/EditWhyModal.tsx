"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
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
  const [text, setText] = useState(meta.why_caregiving || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const hasChanges = text !== (meta.why_caregiving || "");
  const isValid = charCount >= 100 && charCount <= 500;

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }

    if (!isValid) {
      setError("Your statement must be between 100 and 500 characters");
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
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Why I Want to Be a Caregiver"
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
        <p className="text-sm text-gray-500">
          This is one of the first things providers read. Be genuine — think of it like a personal statement.
        </p>

        <div className="text-xs space-y-1 bg-gray-50 rounded-lg p-3">
          <p className="text-gray-600 font-semibold">Strong answers include:</p>
          <ul className="ml-3 list-disc space-y-0.5 text-gray-500">
            <li>What personally draws you to caregiving</li>
            <li>How this connects to your career path (med school, nursing, PA, etc.)</li>
            <li>A specific experience that motivated you (family care, volunteer work, etc.)</li>
          </ul>
          <p className="mt-2 text-gray-400 italic">
            AI tools are fine for brainstorming, but write the final version in your own voice. Providers can tell when answers feel generic — your real story is what makes you stand out.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I want to be a caregiver because..."
          rows={6}
          maxLength={500}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
        />

        <div className="flex items-center justify-between">
          <span className={`text-xs ${charCount < 100 ? "text-amber-500" : "text-gray-400"}`}>
            {charCount}/500 {charCount < 100 && `(${100 - charCount} more needed)`}
          </span>
          {charCount >= 100 && charCount <= 500 && (
            <span className="text-xs text-emerald-500">Good length</span>
          )}
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
