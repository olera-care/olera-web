"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { SCENARIO_QUESTIONS } from "@/lib/medjobs-completeness";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";

export default function EditScenarioModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;
  const responses = meta.scenario_responses || [];

  const [answers, setAnswers] = useState<string[]>(() =>
    SCENARIO_QUESTIONS.map((q) => {
      const existing = responses.find((r) => r.question === q.question);
      return existing?.answer || "";
    })
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalAnswers = SCENARIO_QUESTIONS.map((q) => {
    const existing = responses.find((r) => r.question === q.question);
    return existing?.answer || "";
  });

  const hasChanges = JSON.stringify(answers) !== JSON.stringify(originalAnswers);
  const allValid = answers.every((a) => a.length >= 50);

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }

    if (!allValid) {
      setError("All questions require at least 50 characters");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          scenario_responses: SCENARIO_QUESTIONS.map((q, i) => ({
            question: q.question,
            answer: answers[i].trim(),
          })),
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const updateAnswer = (index: number, value: string) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Screening Questions"
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
      <div className="space-y-6 pt-4">
        <p className="text-sm text-gray-500">
          Providers use these answers to assess reliability, judgement, and commitment. Thoughtful, honest responses make you stand out.
        </p>
        <p className="text-xs text-gray-400 italic">
          You can use AI to organize your thoughts, but make sure the final answers reflect how you would actually respond. Providers may ask follow-up questions in interviews.
        </p>

        {SCENARIO_QUESTIONS.map((q, i) => (
          <div key={q.key}>
            <p className="text-sm font-medium text-gray-900 mb-2">{q.question}</p>
            <textarea
              value={answers[i]}
              onChange={(e) => updateAnswer(i, e.target.value)}
              placeholder="Your answer (minimum 50 characters)..."
              rows={3}
              className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
            />
            <span className={`text-xs ${answers[i].length < 50 ? "text-amber-500" : "text-gray-400"}`}>
              {answers[i].length}/50 min
            </span>
          </div>
        ))}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
